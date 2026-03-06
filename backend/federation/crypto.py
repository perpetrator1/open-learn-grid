"""
Cryptographic utilities for federation.

Uses RSA-SHA256 for activity signing and verification.
"""

import base64
import hashlib
import logging

logger = logging.getLogger(__name__)


def generate_keypair():
    """Generate an RSA-2048 key pair. Returns (private_key_pem, public_key_pem)."""
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.backends import default_backend

        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend(),
        )
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode()
        public_pem = private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()
        return private_pem, public_pem
    except ImportError:
        raise RuntimeError("Install 'cryptography' package: pip install cryptography")


def sign_payload(private_key_pem: str, payload_bytes: bytes) -> str:
    """Sign payload bytes with RSA private key. Returns base64-encoded signature."""
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.backends import default_backend

    private_key = serialization.load_pem_private_key(
        private_key_pem.encode(),
        password=None,
        backend=default_backend(),
    )
    signature = private_key.sign(payload_bytes, padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(signature).decode()


def verify_signature(public_key_pem: str, payload_bytes: bytes, signature_b64: str) -> bool:
    """Verify an RSA-SHA256 signature. Returns True if valid."""
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.hazmat.backends import default_backend
        from cryptography.exceptions import InvalidSignature

        public_key = serialization.load_pem_public_key(
            public_key_pem.encode(),
            backend=default_backend(),
        )
        signature = base64.b64decode(signature_b64)
        public_key.verify(signature, payload_bytes, padding.PKCS1v15(), hashes.SHA256())
        return True
    except Exception as exc:
        logger.warning("Signature verification failed: %s", exc)
        return False


def sha256_digest(data: bytes) -> str:
    """Return base64-encoded SHA-256 digest of data (for HTTP Digest header)."""
    digest = hashlib.sha256(data).digest()
    return "SHA-256=" + base64.b64encode(digest).decode()


def public_key_fingerprint(public_key_pem: str) -> str:
    """Return first 32 hex chars of the SHA-256 of the DER-encoded public key."""
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        pub = serialization.load_pem_public_key(public_key_pem.encode(), backend=default_backend())
        der = pub.public_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        return hashlib.sha256(der).hexdigest()[:32]
    except Exception:
        return "invalid-key"
