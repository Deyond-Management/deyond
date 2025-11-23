#!/bin/bash

# Security Audit Script for Dependencies
# Run this before each release

echo "🔒 Deyond Wallet Security Audit"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check npm audit
echo "📦 Running npm audit..."
npm audit --json > /tmp/npm-audit.json 2>&1
VULNERABILITIES=$(cat /tmp/npm-audit.json | jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' 2>/dev/null || echo "0")

if [ "$VULNERABILITIES" -gt 0 ]; then
    echo -e "${RED}❌ Found $VULNERABILITIES high/critical vulnerabilities${NC}"
    npm audit --audit-level=high
    exit 1
else
    echo -e "${GREEN}✅ No high/critical vulnerabilities found${NC}"
fi
echo ""

# Check for hardcoded secrets
echo "🔑 Checking for hardcoded secrets..."
SECRETS_FOUND=0

# Check for API keys
if grep -r "AKIA\|sk_live\|pk_live\|api_key\s*=\s*['\"]" --include="*.ts" --include="*.tsx" --include="*.js" src/; then
    echo -e "${RED}❌ Potential hardcoded API keys found${NC}"
    SECRETS_FOUND=1
fi

# Check for private keys
if grep -r "0x[a-fA-F0-9]{64}" --include="*.ts" --include="*.tsx" src/; then
    echo -e "${RED}❌ Potential hardcoded private keys found${NC}"
    SECRETS_FOUND=1
fi

if [ "$SECRETS_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✅ No hardcoded secrets found${NC}"
fi
echo ""

# Check for console.log with sensitive data
echo "📝 Checking for sensitive data in logs..."
if grep -r "console\.log.*password\|console\.log.*mnemonic\|console\.log.*privateKey\|console\.log.*pin" --include="*.ts" --include="*.tsx" src/; then
    echo -e "${YELLOW}⚠️  Potential sensitive data in console.log${NC}"
else
    echo -e "${GREEN}✅ No sensitive data in logs${NC}"
fi
echo ""

# Check dependencies licenses
echo "📄 Checking dependency licenses..."
npx license-checker --summary --failOn "GPL;AGPL" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No problematic licenses found${NC}"
else
    echo -e "${YELLOW}⚠️  Check license compatibility${NC}"
fi
echo ""

# Check for outdated dependencies
echo "📅 Checking for outdated dependencies..."
npm outdated --json > /tmp/npm-outdated.json 2>&1
OUTDATED=$(cat /tmp/npm-outdated.json | jq 'length' 2>/dev/null || echo "0")
if [ "$OUTDATED" -gt 10 ]; then
    echo -e "${YELLOW}⚠️  $OUTDATED outdated packages found${NC}"
else
    echo -e "${GREEN}✅ Dependencies are reasonably up to date${NC}"
fi
echo ""

# TypeScript strict mode check
echo "🔍 Checking TypeScript configuration..."
if grep -q '"strict": true' tsconfig.json 2>/dev/null; then
    echo -e "${GREEN}✅ TypeScript strict mode enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Enable TypeScript strict mode${NC}"
fi
echo ""

# Summary
echo "================================"
echo "🔒 Security Audit Complete"
echo "================================"
