from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time

SECRET_KEY = "asset-management-saas-secret-key-change-in-production"
TOKEN_EXPIRATION_SECONDS = 86400 * 7  # 24 hours * 7 days


def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2 with a random 16-byte salt."""
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """Verifies a plain password against the stored PBKDF2 hash."""
    if not hashed_password or "$" not in hashed_password:
        return False
    try:
        salt_hex, key_hex = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(key, expected_key)
    except Exception:
        return False


def create_token(person_id: int, email: str) -> str:
    """Generates a signed HMAC token containing person_id, email, and exp timestamp."""
    payload = {
        "sub": person_id,
        "email": email,
        "exp": int(time.time()) + TOKEN_EXPIRATION_SECONDS,
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode("utf-8").rstrip("=")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def decode_token(token: str) -> dict | None:
    """Decodes and validates a signed HMAC token."""
    try:
        if "." not in token:
            return None
        payload_b64, signature = token.split(".", 1)
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None

        # Add padding back if necessary
        padding = "=" * (4 - (len(payload_b64) % 4))
        payload_json = base64.urlsafe_b64decode(payload_b64 + padding).decode("utf-8")
        payload = json.loads(payload_json)

        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None
