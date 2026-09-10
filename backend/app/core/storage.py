from __future__ import annotations

from botocore.exceptions import ClientError
import boto3

from app.core.config import settings


class StorageService:
    def __init__(self) -> None:
        self._client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
        )

    def ensure_bucket(self, bucket_name: str) -> None:
        try:
            self._client.head_bucket(Bucket=bucket_name)
        except ClientError:
            self._client.create_bucket(Bucket=bucket_name)

    def upload_bytes(self, bucket_name: str, object_key: str, data: bytes, content_type: str | None = None) -> None:
        self.ensure_bucket(bucket_name)
        extra_args = {"ContentType": content_type} if content_type else {}
        self._client.put_object(Bucket=bucket_name, Key=object_key, Body=data, **extra_args)

    def get_object(self, bucket_name: str, object_key: str):
        return self._client.get_object(Bucket=bucket_name, Key=object_key)


storage_service = StorageService()
