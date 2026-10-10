FROM python:3.11-slim
WORKDIR /app
RUN useradd -m -u 1000 user
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir torch==2.6.0 torchvision==0.21.0 --index-url https://download.pytorch.org/whl/cpu
COPY --chown=user . .
USER user
ENV HOME=/home/user PYTHONUNBUFFERED=1 TORCH_THREADS=2
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1", "--no-access-log"]
