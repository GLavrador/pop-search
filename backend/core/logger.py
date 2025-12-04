import logging
import sys
import os 
from logging.config import dictConfig

LOG_FORMAT = "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s"

def configure_logging():
    
    log_level = os.getenv("LOG_LEVEL", "DEBUG").upper()

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": LOG_FORMAT,
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "access": {
                "format": "[%(asctime)s] [%(levelname)s] [%(name)s] %(client_addr)s - \"%(request_line)s\" %(status_code)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": sys.stdout,
            },
        },
        "loggers": {
            "popsearch": {
                "handlers": ["console"],
                "level": log_level,  
                "propagate": False,
            },
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO", 
                "propagate": False,
            },
            "uvicorn.error": {
                "level": "INFO",
            },
            "uvicorn.access": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }

    dictConfig(logging_config)

def get_logger(name: str):
    return logging.getLogger(f"popsearch.{name}")