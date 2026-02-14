#!/usr/bin/env python3
"""
Automation script for common IT issues
"""

import json
import sys
import subprocess
import platform
import time
from datetime import datetime

def log_action(action, ticket_id):
    """Log automation actions"""
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] Ticket {ticket_id}: {action}"
    print(log_entry)
    return log_entry

def clear_cache():
    """Clear system cache (mock implementation)"""
    log_action("Clearing system cache", "unknown")
    time.sleep(2)  # Simulate work
    return {"action": "clear_cache", "status": "success", "message": "Cache cleared successfully"}

def restart_service(service_name):
    """Restart a service (mock implementation)"""
    log_action(f"Restarting service: {service_name}", "unknown")
    time.sleep(3)  # Simulate work
    return {"action": "restart_service", "service": service_name, "status": "success", "message": f"Service {service_name} restarted"}

def reset_password(user_email):
    """Reset user password (mock implementation)"""
    log_action(f"Resetting password for: {user_email}", "unknown")
    time.sleep(2)  # Simulate work
    return {"action": "reset_password", "email": user_email, "status": "success", "message": "Password reset link sent"}

def check_network_connectivity():
    """Check network connectivity (mock implementation)"""
    log_action("Checking network connectivity", "unknown")
    time.sleep(1)  # Simulate work
    
    # Mock network check
    connectivity_status = {
        "internet": "connected",
        "dns": "working",
        "latency": "45ms"
    }
    
    return {"action": "network_check", "status": "success", "data": connectivity_status}

def diagnose_system():
    """Run system diagnostics (mock implementation)"""
    log_action("Running system diagnostics", "unknown")
    time.sleep(5)  # Simulate work
    
    diagnostics = {
        "cpu_usage": "45%",
        "memory_usage": "67%",
        "disk_space": "78% used",
        "services": {
            "web_server": "running",
            "database": "running",
            "cache": "running"
        }
    }
    
    return {"action": "system_diagnosis", "status": "success", "data": diagnostics}

def main():
    """Main automation function"""
    try:
        # Parse input parameters
        if len(sys.argv) < 2:
            print("Error: Missing parameters")
            sys.exit(1)
        
        parameters = json.loads(sys.argv[1])
        ticket_id = parameters.get('ticketId', 'unknown')
        
        # Determine action based on ticket context or parameters
        action = parameters.get('action', 'diagnose')
        
        result = None
        
        if action == "clear_cache":
            result = clear_cache()
        elif action == "restart_service":
            service_name = parameters.get('service_name', 'web_server')
            result = restart_service(service_name)
        elif action == "reset_password":
            user_email = parameters.get('user_email', 'user@example.com')
            result = reset_password(user_email)
        elif action == "check_network":
            result = check_network_connectivity()
        elif action == "diagnose":
            result = diagnose_system()
        else:
            # Default to system diagnosis
            result = diagnose_system()
        
        # Add execution metadata
        result['execution_time'] = datetime.now().isoformat()
        result['ticket_id'] = ticket_id
        result['platform'] = platform.system()
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "action": "error",
            "status": "failed",
            "error": str(e),
            "execution_time": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
