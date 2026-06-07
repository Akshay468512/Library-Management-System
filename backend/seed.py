import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import hashlib
import secrets

def hash_password(password):
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}${hashed.hex()}"

# Initialize Firebase Connection
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    pass  

db = firestore.client()

# Clean, standard college library data sets
CAMPUS_BOOKS = [
    {"title": "Introduction to Algorithms", "author": "Thomas H. Cormen", "isbn": "9780262033848", "isAvailable": True},
    {"title": "Database System Concepts", "author": "Abraham Silberschatz", "isbn": "9780073523323", "isAvailable": True},
    {"title": "Computer Networks", "author": "Andrew S. Tanenbaum", "isbn": "9780132126953", "isAvailable": False},
    {"title": "Software Engineering: A Practitioner's Approach", "author": "Roger S. Pressman", "isbn": "9780078022128", "isAvailable": True}
]

CAMPUS_USERS = [
    {"uid": "STU001", "name": "Rohan Sharma", "email": "rohan.s@student.edu", "usn": "1CD23CS010", "studentId": "1CD23CS010", "role": "student", "passwordHash": hash_password("student123")},
    {"uid": "STU002", "name": "Sneha Reddy", "email": "sneha.r@student.edu", "usn": "1CD23CS045", "studentId": "1CD23CS045", "role": "student", "passwordHash": hash_password("student123")},
    {"uid": "STU003", "name": "Prof. Amit Verma", "email": "amit.v@faculty.edu", "usn": "FACULTY01", "studentId": "FACULTY01", "role": "librarian", "passwordHash": hash_password("staff123")}
]

def populate_library():
    print("🚀 Starting campus database population...")
    
    # 1. Add Books
    print("📚 Adding books to inventory...")
    for book in CAMPUS_BOOKS:
        db.collection("books").document(book["isbn"]).set(book)
        
    # 2. Add Users
    print("🎓 Adding student and staff profiles...")
    for user in CAMPUS_USERS:
        db.collection("users").document(user["uid"]).set(user)
        
    # 3. Add an Unpaid Fine for testing the E-Gate blocker logic
    print("💰 Creating a sample fine record for testing...")
    sample_fine = {
        "studentId": "1CD23CS045",  # Sneha Reddy will be blocked due to this fine
        "amount": 50,
        "status": "unpaid",
        "timestamp": datetime.datetime.utcnow()
    }
    db.collection("fines").document("test_fine_01").set(sample_fine)

    print("✅ Database successfully populated with standard campus data!")

if __name__ == "__main__":
    populate_library()