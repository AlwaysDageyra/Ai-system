import requests

BASE = "http://127.0.0.1:5000"

# Login as supplier
login = requests.post(f"{BASE}/api/login", json={"email": "supplier@tender.com", "password": "supplierpass"})
print("Login:", login.status_code, login.json())
token = login.json().get("token")

# Submit proposal
headers = {"Authorization": f"Bearer {token}"}
pdf_path = r"C:\Users\pc\ai-system\uploads\proposals\proposal-d29475a276.pdf"

with open(pdf_path, "rb") as f:
    resp = requests.post(
        f"{BASE}/api/proposals",
        headers=headers,
        data={"tender_id": "1"},
        files={"file": ("test.pdf", f, "application/pdf")}
    )

print("Submit status:", resp.status_code)
print("Response:", resp.text[:3000])
