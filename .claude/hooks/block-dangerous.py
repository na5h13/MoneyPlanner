#!/usr/bin/env python3
"""
PreToolUse hook to block dangerous commands, detect secrets, and audit all bash commands.
Location: .claude/hooks/block-dangerous.py

Cherry-picked from Ruflo v3.5 bash-safety patterns + Keel v3 originals.

NOTE: This is a "catch obvious mistakes" layer, NOT a security boundary.
An autonomous agent can construct commands that bypass pattern matching.
The primary safety mechanism is the command audit log for post-hoc review.

Edit DANGEROUS_PATTERNS and SECRET_PATTERNS to customize.
"""
import sys
import json
import os
import re
from datetime import datetime

LOG_DIR = os.path.expanduser("~/.claude/logs")
AUDIT_LOG = os.path.join(LOG_DIR, "command_audit.log")

DANGEROUS_PATTERNS = [
    # Destructive file operations
    'rm -rf /',
    'rm -rf ~',
    'rm -rf .',
    'sudo rm -rf',

    # Disk operations
    'sudo dd',
    'mkfs',
    'fdisk',
    '> /dev/sd',

    # Permission chaos
    'chmod -R 777 /',
    'chown -R',

    # Remote code execution
    '| sudo bash',
    '| bash',
    'curl | sh',
    'wget | sh',

    # System control
    'sudo shutdown',
    'sudo reboot',
    'sudo init',

    # Git disasters
    'git push --force',
    'git push -f ',
    'git push --force-with-lease',
    'git reset --hard',
    'git clean -fd',
    'git checkout -- .',

    # Database disasters
    'DROP DATABASE',
    'DROP TABLE',

    # Fork bomb
    ':(){ :|:& };:',

    # Additional destructive commands
    'find / -delete',
    'truncate -s 0',
]

# Cherry-picked from Ruflo v3.5 bash-safety.ts SECRET_PATTERNS
SECRET_PATTERNS = [
    (r'(api[_-]?key)\s*[=:]\s*[\'"]?([^\s\'"]{8,})', 'API key'),
    (r'\bsk-[a-zA-Z0-9]{20,}', 'OpenAI API key'),
    (r'\bghp_[a-zA-Z0-9]{36,}', 'GitHub token'),
    (r'\bgho_[a-zA-Z0-9]{36,}', 'GitHub OAuth token'),
    (r'\bghu_[a-zA-Z0-9]{36,}', 'GitHub user token'),
    (r'\bghs_[a-zA-Z0-9]{36,}', 'GitHub server token'),
    (r'\bghr_[a-zA-Z0-9]{36,}', 'GitHub refresh token'),
    (r'\bnpm_[a-zA-Z0-9]{36,}', 'npm token'),
    (r'\bAKIA[A-Z0-9]{16}', 'AWS access key'),
    (r'(password|passwd|pwd)\s*[=:]\s*[\'"]?([^\s\'"]{6,})', 'Password'),
    (r'(bearer|token)\s+[a-zA-Z0-9._\-]{20,}', 'Bearer token'),
    (r'-----BEGIN\s+(RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY-----', 'Private key'),
    (r'(secret|credential|auth)\s*[=:]\s*[\'"]?([^\s\'"]{8,})', 'Secret/credential'),
]

# Patterns that indicate secret exfiltration via network
EXFIL_PATTERNS = [
    r'curl\s+.*(-d|--data)\s+.*\$(.*PASSWORD|.*SECRET|.*KEY|.*TOKEN)',
    r'wget\s+.*\$(.*PASSWORD|.*SECRET|.*KEY|.*TOKEN)',
    r'curl\s+.*\|\s*nc\b',
]


def audit_log(command, decision, reason=""):
    """Log every command for post-hoc review."""
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        entry = f"[{timestamp}] [{decision}] {command[:500]}"
        if reason:
            entry += f" | REASON: {reason}"
        entry += "\n"
        with open(AUDIT_LOG, 'a') as f:
            f.write(entry)
    except Exception:
        pass  # Audit logging should never block execution


def check_secrets(command):
    """Check if command contains embedded secrets. Returns (found, pattern_name)."""
    for pattern, name in SECRET_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True, name
    return False, ""


def check_exfiltration(command):
    """Check if command attempts to exfiltrate secrets via network."""
    for pattern in EXFIL_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True
    return False


def main():
    try:
        hook_input = json.loads(sys.stdin.read())
        tool_name = hook_input.get('tool_name', '')
        tool_input = hook_input.get('tool_input', {})

        if tool_name != 'Bash':
            print(json.dumps({"decision": "allow"}))
            return

        command = tool_input.get('command', '')

        # Check dangerous patterns
        for pattern in DANGEROUS_PATTERNS:
            if pattern.lower() in command.lower():
                audit_log(command, "BLOCKED", f"Dangerous: {pattern}")
                print(f"BLOCKED: '{pattern}' detected", file=sys.stderr)
                print(f"   Command: {command[:100]}...", file=sys.stderr)
                sys.exit(2)

        # Check for embedded secrets in commands
        has_secret, secret_type = check_secrets(command)
        if has_secret:
            audit_log(command, "BLOCKED", f"Secret detected: {secret_type}")
            print(f"BLOCKED: {secret_type} detected in command", file=sys.stderr)
            print(f"   Never embed secrets in commands. Use env vars.", file=sys.stderr)
            sys.exit(2)

        # Check for secret exfiltration attempts
        if check_exfiltration(command):
            audit_log(command, "BLOCKED", "Secret exfiltration attempt")
            print("BLOCKED: Possible secret exfiltration via network", file=sys.stderr)
            sys.exit(2)

        audit_log(command, "ALLOWED")
        print(json.dumps({"decision": "allow"}))

    except Exception as e:
        # Fail-open but log the failure
        audit_log(f"HOOK_ERROR: {e}", "ERROR")
        print(f"Hook error: {e}", file=sys.stderr)
        print(json.dumps({"decision": "allow"}))


if __name__ == '__main__':
    main()
