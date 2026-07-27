---
name: passlib Python 3.13 incompatibility
description: passlib[bcrypt] crashes on Python 3.13 due to bcrypt API changes; replacement pattern using bcrypt directly
---

passlib's bcrypt backend crashes on Python 3.13 with two errors:
- `AttributeError: module 'bcrypt' has no attribute '__about__'`
- `ValueError: password cannot be longer than 72 bytes`

**Why:** passlib tries to read `bcrypt.__about__.__version__` to detect the bcrypt version, but newer bcrypt removed `__about__`. Then it fails during backend initialization.

**How to apply:** Replace `passlib.context.CryptContext` with direct `bcrypt` calls:

```python
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False
```

Remove `passlib[bcrypt]` from requirements; keep `bcrypt` directly installed.
