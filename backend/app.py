from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import qrcode
import io
import base64
import uuid
import os
import traceback
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)

SERVICE_ACCOUNT_PATH = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

PENALTY_RATE_PER_DAY = int(os.environ.get("PENALTY_RATE_PER_DAY", "10"))
LOAN_PERIOD_DAYS = int(os.environ.get("LOAN_PERIOD_DAYS", "14"))
VALID_ROLES = ("member", "operator", "executive")


def serialize_doc(doc):
    data = doc.to_dict() or {}
    data["id"] = doc.id
    for key, value in data.items():
        if hasattr(value, "isoformat"):
            data[key] = value.isoformat()
    return data


@app.route("/api/books", methods=["GET"])
def get_books():
    try:
        docs = db.collection("books").stream()
        return jsonify([serialize_doc(doc) for doc in docs]), 200
    except Exception as e:
        print(f"Error fetching catalog assets: {e}")
        return jsonify({"message": "Failed to retrieve catalog assets."}), 500


def _penalty_amount(fine_data):
    """Resolve penalty value across current and legacy field names."""
    return fine_data.get("penaltyAccumulated") or fine_data.get("amount") or 0


def _fetch_unpaid_fines(member_id):
    """
    Fetch unpaid fines for a member without requiring composite Firestore indexes.
    Queries by a single equality filter, then filters status in memory.
    Supports both memberId (current schema) and studentId (legacy schema).
    """
    unpaid = []
    seen_ids = set()

    for id_field in ("memberId", "studentId"):
        try:
            docs = db.collection("fines").where(id_field, "==", member_id).stream()
            for doc in docs:
                if doc.id in seen_ids:
                    continue
                data = doc.to_dict() or {}
                if data.get("status") == "unpaid":
                    unpaid.append(doc)
                    seen_ids.add(doc.id)
        except Exception as query_error:
            print(f"=== FINES QUERY WARNING ({id_field}) ===")
            print(str(query_error))

    return unpaid


@app.route("/api/generate_pass/<member_id>", methods=["GET"])
def generate_gate_pass(member_id):
    try:
        unpaid_fines = _fetch_unpaid_fines(member_id)

        if unpaid_fines:
            total_due = sum(_penalty_amount(doc.to_dict()) for doc in unpaid_fines)
            return (
                jsonify(
                    {
                        "status": "ERROR",
                        "message": (
                            f"Exit pass denied. Unpaid fines total: {total_due} units. "
                            "Pay all fines before requesting an exit pass."
                        ),
                    }
                ),
                403,
            )

        token = str(uuid.uuid4())
        clearance_ref = db.collection("clearance_passes").document()
        clearance_ref.set(
            {
                "memberId": member_id,
                "token": token,
                "status": "active",
                "createdAt": firestore.SERVER_TIMESTAMP,
            }
        )

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(token)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return (
            jsonify(
                {
                    "status": "SUCCESS",
                    "message": (
                        f"Exit pass issued for student {member_id}. "
                        "Show this QR code at the library gate."
                    ),
                    "qr_code": f"data:image/png;base64,{qr_base64}",
                    "token": token,
                }
            ),
            200,
        )
    except Exception as e:
        print("=== FIRESTORE API CRASH LOG ===")
        traceback.print_exc()
        return jsonify({"status": "ERROR", "message": f"Backend Exception: {str(e)}"}), 500


@app.route("/api/verify_pass", methods=["POST"])
def verify_pass():
    try:
        data = request.get_json() or {}
        token = (data.get("token") or "").strip()

        if not token:
            return jsonify({"status": "ACCESS DENIED", "message": "No QR token provided."}), 400

        passes = (
            db.collection("clearance_passes")
            .where("token", "==", token)
            .limit(1)
            .stream()
        )
        pass_doc = next(passes, None)

        if pass_doc is None:
            return (
                jsonify(
                    {
                        "status": "ACCESS DENIED",
                        "message": "Token not found.",
                    }
                ),
                200,
            )

        pass_data = pass_doc.to_dict()
        if pass_data.get("status") != "active":
            return (
                jsonify(
                    {
                        "status": "ACCESS DENIED",
                        "message": f"Token invalidated (status: {pass_data.get('status')}).",
                    }
                ),
                200,
            )

        pass_doc.reference.update(
            {"status": "used", "verifiedAt": firestore.SERVER_TIMESTAMP}
        )

        return (
            jsonify(
                {
                    "status": "ACCESS GRANTED",
                    "message": f"Library exit approved for student {pass_data.get('memberId')}.",
                    "memberId": pass_data.get("memberId"),
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Error in verify_pass: {e}")
        return jsonify({"status": "ACCESS DENIED", "message": "Verification service unavailable."}), 500


@app.route("/api/auth/register-profile", methods=["POST"])
def register_profile():
    try:
        data = request.get_json() or {}
        uid = data.get("uid")

        if not uid:
            return jsonify({"message": "uid is required."}), 400

        role = data.get("role", "member")
        if role not in VALID_ROLES:
            role = "member"

        user_payload = {
            "uid": uid,
            "email": data.get("email"),
            "name": data.get("name"),
            "identifierCode": data.get("identifierCode"),
            "role": role,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        user_ref = db.collection("users").document(uid)
        if not user_ref.get().exists:
            user_payload["createdAt"] = firestore.SERVER_TIMESTAMP

        user_ref.set(user_payload, merge=True)

        return jsonify({"message": "Profile persisted successfully.", "uid": uid, "role": role}), 200
    except Exception as e:
        print(f"Error in register_profile: {e}")
        return jsonify({"message": "Failed to register profile."}), 500


@app.route("/api/transactions/issue", methods=["POST"])
def issue_asset():
    try:
        data = request.get_json() or {}
        member_id = data.get("memberId")
        asset_id = data.get("assetId")

        if not member_id or not asset_id:
            return jsonify({"message": "memberId and assetId are required."}), 400

        asset_ref = db.collection("books").document(asset_id)
        asset_doc = asset_ref.get()

        if not asset_doc.exists:
            return jsonify({"message": "Catalog asset not found."}), 404

        asset_data = asset_doc.to_dict()
        if not asset_data.get("isAvailable", False):
            return jsonify({"message": "Asset is unavailable for check-out."}), 400

        due_timestamp = datetime.now(timezone.utc) + timedelta(days=LOAN_PERIOD_DAYS)
        transaction_ref = db.collection("transactions").document()

        batch = db.batch()
        batch.set(
            transaction_ref,
            {
                "memberId": member_id,
                "assetId": asset_id,
                "issueTimestamp": firestore.SERVER_TIMESTAMP,
                "dueTimestamp": due_timestamp,
                "status": "active",
            },
        )
        batch.update(asset_ref, {"isAvailable": False})
        batch.commit()

        return (
            jsonify(
                {
                    "message": "Asset checked out successfully.",
                    "transactionId": transaction_ref.id,
                    "dueTimestamp": due_timestamp.isoformat(),
                }
            ),
            201,
        )
    except Exception as e:
        print(f"Error in issue_asset: {e}")
        return jsonify({"message": "Check-out operation failed."}), 500


@app.route("/api/transactions/return", methods=["POST"])
def return_asset():
    try:
        data = request.get_json() or {}
        transaction_id = data.get("transactionId")

        if not transaction_id:
            return jsonify({"message": "transactionId is required."}), 400

        transaction_ref = db.collection("transactions").document(transaction_id)
        transaction_doc = transaction_ref.get()

        if not transaction_doc.exists:
            return jsonify({"message": "Transaction record not found."}), 404

        transaction_data = transaction_doc.to_dict()
        if transaction_data.get("status") == "complete":
            return jsonify({"message": "Asset already checked in for this transaction."}), 400

        asset_id = transaction_data.get("assetId")
        member_id = transaction_data.get("memberId")
        asset_ref = db.collection("books").document(asset_id)

        penalty_accumulated = 0
        fine_id = None
        days_overdue = 0
        due_timestamp = transaction_data.get("dueTimestamp")
        now = datetime.now(timezone.utc)

        if due_timestamp:
            if due_timestamp.tzinfo is None:
                due_timestamp = due_timestamp.replace(tzinfo=timezone.utc)
            if now > due_timestamp:
                days_overdue = max((now - due_timestamp).days, 1)
                penalty_accumulated = days_overdue * PENALTY_RATE_PER_DAY

        batch = db.batch()
        batch.update(
            transaction_ref,
            {"status": "complete", "returnTimestamp": firestore.SERVER_TIMESTAMP},
        )
        batch.update(asset_ref, {"isAvailable": True})

        if penalty_accumulated > 0:
            fine_ref = db.collection("fines").document()
            fine_id = fine_ref.id
            batch.set(
                fine_ref,
                {
                    "memberId": member_id,
                    "transactionId": transaction_id,
                    "penaltyAccumulated": penalty_accumulated,
                    "daysOverdue": days_overdue,
                    "status": "unpaid",
                    "createdAt": firestore.SERVER_TIMESTAMP,
                },
            )

        batch.commit()

        response = {
            "message": "Asset checked in successfully.",
            "transactionId": transaction_id,
            "penaltyApplied": penalty_accumulated > 0,
            "penaltyAccumulated": penalty_accumulated,
            "daysOverdue": days_overdue,
        }
        if fine_id:
            response["fineId"] = fine_id

        return jsonify(response), 200
    except Exception as e:
        print(f"Error in return_asset: {e}")
        return jsonify({"message": "Check-in operation failed."}), 500


@app.route("/api/fines/pay", methods=["POST"])
def pay_fine():
    try:
        data = request.get_json() or {}
        fine_id = data.get("fineId")

        if not fine_id:
            return jsonify({"message": "fineId is required."}), 400

        fine_ref = db.collection("fines").document(fine_id)
        fine_doc = fine_ref.get()

        if not fine_doc.exists:
            return jsonify({"message": "Fine record not found."}), 404

        fine_data = fine_doc.to_dict()
        if fine_data.get("status") == "paid":
            return jsonify({"message": "Fine already paid."}), 400

        fine_ref.update({"status": "paid", "paidAt": firestore.SERVER_TIMESTAMP})

        return (
            jsonify(
                {
                    "message": "Fine payment recorded.",
                    "fineId": fine_id,
                    "penaltyAccumulated": fine_data.get("penaltyAccumulated", 0),
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Error in pay_fine: {e}")
        return jsonify({"message": "Payment failed."}), 500


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    try:
        status = request.args.get("status", "active")
        docs = db.collection("transactions").where("status", "==", status).stream()
        return jsonify([serialize_doc(doc) for doc in docs]), 200
    except Exception as e:
        print(f"Error fetching transactions: {e}")
        return jsonify({"message": "Failed to retrieve transaction records."}), 500


@app.route("/api/fines", methods=["GET"])
def get_fines():
    try:
        status = request.args.get("status")
        fines_ref = db.collection("fines")
        if status:
            fines_ref = fines_ref.where("status", "==", status)
        return jsonify([serialize_doc(doc) for doc in fines_ref.stream()]), 200
    except Exception as e:
        print(f"Error fetching fines: {e}")
        return jsonify({"message": "Failed to retrieve penalty records."}), 500


@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    try:
        assets = list(db.collection("books").stream())
        total_assets = len(assets)
        checked_out = sum(1 for asset in assets if not asset.to_dict().get("isAvailable", True))
        available = total_assets - checked_out

        active_loans = list(
            db.collection("transactions").where("status", "==", "active").stream()
        )
        now = datetime.now(timezone.utc)
        overdue_count = 0

        for loan in active_loans:
            due_timestamp = loan.to_dict().get("dueTimestamp")
            if due_timestamp:
                if due_timestamp.tzinfo is None:
                    due_timestamp = due_timestamp.replace(tzinfo=timezone.utc)
                if now > due_timestamp:
                    overdue_count += 1

        unpaid_fines = list(db.collection("fines").where("status", "==", "unpaid").stream())
        outstanding_amount = sum(
            doc.to_dict().get("penaltyAccumulated", 0) for doc in unpaid_fines
        )
        outstanding_count = len(unpaid_fines)
        checkout_ratio = round((checked_out / total_assets) * 100, 1) if total_assets else 0

        return (
            jsonify(
                {
                    "totalAssets": total_assets,
                    "availableAssets": available,
                    "checkedOutAssets": checked_out,
                    "checkoutRatio": checkout_ratio,
                    "activeLoans": len(active_loans),
                    "overdueCount": overdue_count,
                    "outstandingPenaltiesCount": outstanding_count,
                    "outstandingPenaltiesAmount": outstanding_amount,
                }
            ),
            200,
        )
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        return jsonify({"message": "Analytics service unavailable."}), 500


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", "5000")))
