# Deploying on Kubernetes

This guide covers deploying Open Learn Grid on a Kubernetes cluster. You'll need `kubectl` access to a cluster (EKS, GKE, AKS, or self-hosted k3s/k8s).

## Prerequisites

- `kubectl` configured for your cluster
- A PostgreSQL instance (RDS, Cloud SQL, CrunchyData, or in-cluster)
- A Redis instance (ElastiCache, Memorystore, or in-cluster)
- Container registry access (Docker Hub, ECR, GCR, etc.)
- An Ingress controller (nginx-ingress recommended)
- cert-manager for TLS

---

## Namespace

```bash
kubectl create namespace openlearngrid
kubectl config set-context --current --namespace=openlearngrid
```

---

## Secrets

```bash
kubectl create secret generic openlearngrid-env \
  --from-env-file=.env \
  --namespace=openlearngrid
```

Or use Sealed Secrets / External Secrets Operator for GitOps workflows.

---

## Manifests

### Backend Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: openlearngrid
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: yourregistry/openlearngrid-backend:latest
          ports:
            - containerPort: 8000
          envFrom:
            - secretRef:
                name: openlearngrid-env
          readinessProbe:
            httpGet:
              path: /api/readiness/
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/liveness/
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 15
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 1000m
              memory: 1Gi
          volumeMounts:
            - name: media
              mountPath: /app/media
      volumes:
        - name: media
          persistentVolumeClaim:
            claimName: media-pvc
```

### Backend Service

```yaml
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: openlearngrid
spec:
  selector:
    app: backend
  ports:
    - port: 8000
      targetPort: 8000
```

### Celery Worker

```yaml
# k8s/celery-worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
  namespace: openlearngrid
spec:
  replicas: 2
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
        - name: celery-worker
          image: yourregistry/openlearngrid-backend:latest
          command: ["celery", "-A", "config", "worker", "-l", "info", "-c", "4"]
          envFrom:
            - secretRef:
                name: openlearngrid-env
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 2000m
              memory: 2Gi
```

### Frontend Deployment

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: openlearngrid
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: yourregistry/openlearngrid-frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
            limits:
              cpu: 200m
              memory: 256Mi
```

### Ingress (nginx-ingress + cert-manager)

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: openlearngrid
  namespace: openlearngrid
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "120"
spec:
  tls:
    - hosts:
        - learngrid.yourdomain.com
      secretName: openlearngrid-tls
  rules:
    - host: learngrid.yourdomain.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8000
          - path: /admin
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8000
          - path: /.well-known
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8000
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

### Persistent Volumes

```yaml
# k8s/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: media-pvc
  namespace: openlearngrid
spec:
  accessModes:
    - ReadWriteMany   # Use NFS or EFS for multi-replica
  resources:
    requests:
      storage: 50Gi
  storageClassName: standard
```

---

## Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: openlearngrid
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## Deploying

```bash
# Apply all manifests
kubectl apply -f k8s/

# Run migrations (one-time job)
kubectl run migrate --rm -i --restart=Never \
  --image=yourregistry/openlearngrid-backend:latest \
  --env-from=secret/openlearngrid-env \
  -- python manage.py migrate

# Check pods
kubectl get pods -n openlearngrid

# Follow backend logs
kubectl logs -f deployment/backend -n openlearngrid
```

---

## Updating

```bash
# Build and push new image
docker build -f backend/Dockerfile.prod -t yourregistry/openlearngrid-backend:v1.1 backend/
docker push yourregistry/openlearngrid-backend:v1.1

# Rolling update
kubectl set image deployment/backend \
  backend=yourregistry/openlearngrid-backend:v1.1 \
  -n openlearngrid

# Run migrations after update
kubectl run migrate --rm -i --restart=Never \
  --image=yourregistry/openlearngrid-backend:v1.1 \
  --env-from=secret/openlearngrid-env \
  -- python manage.py migrate
```
