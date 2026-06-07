import firebase_admin
from firebase_admin import credentials, firestore
import datetime

# 1. Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    pass  # Already initialized

db = firestore.client()

# 2. Sample data for campus library testing
MOCK_BOOKS = [
    {"title": "Introduction to Algorithms", "author": "T. Cormen", "isbn": "9780134093413", "isAvailable": True},
    {"title": "Clean Code", "author": "R. Martin", "isbn": "9780132350884", "isAvailable": True},
    {"title": "Operating System Concepts", "author": "A. Silberschatz", "isbn": "9780133805917", "isAvailable": False},
    {"title": "Computer Networks", "author": "A. Tanenbaum", "isbn": "9780132126953", "isAvailable": True}
]

MOCK_USERS = [
    {"uid": "USR001", "name": "Alex Carter", "email": "alex.carter@campus.edu", "identifierCode": "1MS22CS001", "role": "member"},
    {"uid": "USR002", "name": "Morgan Lee", "email": "morgan.lee@campus.edu", "identifierCode": "1MS22CS002", "role": "member"},
    {"uid": "USR003", "name": "Jordan Smith", "email": "jordan.s@campus.edu", "identifierCode": "LIB-001", "role": "librarian"}
]

def seed_database():
    print("Starting library database seed...")
    
    # Seed Books
    print("Adding sample books...")
    for book in MOCK_BOOKS:
        # Use ISBN as Document ID to prevent duplicates
        db.collection("books").document(book["isbn"]).set(book)
        
    # Seed Users
    print("Adding sample student accounts...")
    for user in MOCK_USERS:
        db.collection("users").document(user["uid"]).set(user)
        
    # Seed a mock unpaid fine for testing exit pass restrictions (1MS22CS002)
    print("Adding sample fine record...")
    fine_doc = {
        "memberId": "1MS22CS002",
        "amount": 120,
        "status": "unpaid",
        "timestamp": datetime.datetime.utcnow()
    }
    db.collection("fines").document("fine_mock_001").set(fine_doc)

    print("Database seeded with sample campus library data.")

if __name__ == "__main__":
    seed_database()