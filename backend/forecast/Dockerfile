FROM python:3.10-slim
WORKDIR /app
# Install minimal build deps for prophet
RUN apt-get update && apt-get install -y build-essential gfortran libgomp1 python3-dev gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]