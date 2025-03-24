# Role API Authentication Guide

## Get Authentication Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com", "password":"your_password"}'
```

## Access Roles Endpoint (Header Auth)
```bash
curl -X GET http://localhost:3000/api/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Access Roles Endpoint (Cookie Auth)
```bash
curl -X GET http://localhost:3000/api/roles \
  -b "token=YOUR_JWT_TOKEN_HERE"
```

Note: Replace YOUR_JWT_TOKEN_HERE with token received from login response