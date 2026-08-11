import os
from typing import Optional

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request

from core.logger import get_logger

load_dotenv()

logger = get_logger("core.auth")

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
JWT_AUDIENCE = "authenticated"

# Pinned server-side: a token must not choose its own algorithm.
JWT_ALGORITHM = "HS256"


def _decode(token: str) -> dict:
    if not SUPABASE_JWT_SECRET:
        raise jwt.InvalidKeyError("SUPABASE_JWT_SECRET is not configured")

    return jwt.decode(
        token,
        SUPABASE_JWT_SECRET,
        algorithms=[JWT_ALGORITHM],
        audience=JWT_AUDIENCE,
    )


def _extract_bearer(request: Request) -> Optional[str]:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")

    if scheme.lower() != "bearer" or not token.strip():
        return None

    return token.strip()


def current_user_optional(request: Request) -> Optional[str]:
    """User id when a valid token was sent, None otherwise."""
    token = _extract_bearer(request)
    if token is None:
        return None

    try:
        claims = _decode(token)
    except jwt.PyJWTError as e:
        logger.debug(f"Ignoring unusable token on an optional route: {e}")
        return None

    return claims.get("sub")


def current_user(request: Request) -> str:
    """User id, refusing the request when there is no valid token."""
    token = _extract_bearer(request)

    if token is None:
        raise HTTPException(status_code=401, detail="Sign in to use this feature.")

    try:
        claims = _decode(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Your session expired. Sign in again.")
    except jwt.PyJWTError as e:
        logger.warning(f"Rejected token: {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail="Sign in to use this feature.")

    user_id = claims.get("sub")
    if not user_id:
        logger.warning("Token verified but carried no subject claim")
        raise HTTPException(status_code=401, detail="Sign in to use this feature.")

    return user_id


CurrentUser = Depends(current_user)
OptionalUser = Depends(current_user_optional)
