#!/usr/bin/env python3
"""
VPN Restart Automation Script
Restarts VPN service and verifies connectivity
"""

import os
import sys
import json
import subprocess
import time
import platform
import socket
from datetime import datetime

class VPNRestart:
    def __init__(self):
        self.system = platform.system().lower()
        self.actions = []
        
    def log_action(self, action, details):
        """Log VPN actions"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "action": action,
            "details": details
        }
        self.actions.append(log_entry)
        print(f"[{timestamp}] {action}: {details}")
    
    def run_command(self, command, shell=True, capture_output=True):
        """Run system command"""
        try:
            result = subprocess.run(
                command, 
                shell=shell, 
                capture_output=capture_output, 
                text=True, 
                timeout=30
            )
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": "Command timed out",
                "returncode": -1
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "returncode": -1
            }
    
    def check_vpn_status(self):
        """Check current VPN status"""
        try:
            if self.system == "windows":
                # Check for common VPN services
                services = [
                    "OpenVPNService",
                    "OpenVPNServiceInteractive", 
                    "Cisco AnyConnect Secure Mobility Agent",
                    "Pulse Secure",
                    "GlobalProtect Service"
                ]
                
                for service in services:
                    result = self.run_command(f'sc query "{service}"')
                    if result["success"] and "RUNNING" in result["stdout"]:
                        self.log_action("vpn_detected", f"VPN service found: {service}")
                        return {
                            "status": "running",
                            "service": service,
                            "details": result["stdout"]
                        }
                
                return {"status": "not_running", "service": None}
                
            elif self.system == "linux":
                # Check for OpenVPN
                result = self.run_command("systemctl is-active openvpn")
                if result["success"] and "active" in result["stdout"]:
                    self.log_action("vpn_detected", "OpenVPN service is active")
                    return {"status": "running", "service": "openvpn"}
                
                # Check for NetworkManager VPN connections
                result = self.run_command("nmcli connection show --active | grep vpn")
                if result["success"] and result["stdout"]:
                    self.log_action("vpn_detected", "NetworkManager VPN connection active")
                    return {"status": "running", "service": "networkmanager"}
                
                return {"status": "not_running", "service": None}
                
            elif self.system == "darwin":  # macOS
                # Check for VPN interfaces
                result = self.run_command("ifconfig | grep -E 'utun|tun|ppp'")
                if result["success"] and result["stdout"]:
                    self.log_action("vpn_detected", "VPN interface detected on macOS")
                    return {"status": "running", "service": "macos_vpn"}
                
                return {"status": "not_running", "service": None}
                
        except Exception as e:
            self.log_action("error", f"VPN status check failed: {str(e)}")
            return {"status": "unknown", "error": str(e)}
    
    def stop_vpn_service(self, service_name):
        """Stop VPN service"""
        try:
            if self.system == "windows":
                result = self.run_command(f'sc stop "{service_name}"')
                if result["success"]:
                    self.log_action("vpn_stopped", f"Stopped Windows service: {service_name}")
                    return True
                else:
                    self.log_action("error", f"Failed to stop {service_name}: {result['stderr']}")
                    return False
                    
            elif self.system == "linux":
                if service_name == "openvpn":
                    result = self.run_command("sudo systemctl stop openvpn")
                else:
                    result = self.run_command("nmcli connection down $(nmcli connection show | grep vpn | head -1 | awk '{print $1}')")
                
                if result["success"]:
                    self.log_action("vpn_stopped", f"Stopped Linux VPN: {service_name}")
                    return True
                else:
                    self.log_action("error", f"Failed to stop VPN: {result['stderr']}")
                    return False
                    
            elif self.system == "darwin":
                # Disconnect all VPN connections on macOS
                result = self.run_command("sudo scutil --nc list | grep Connected | awk '{print $1}' | xargs -I {} sudo scutil --nc stop {}")
                if result["success"]:
                    self.log_action("vpn_stopped", "Disconnected VPN on macOS")
                    return True
                else:
                    self.log_action("error", f"Failed to disconnect VPN: {result['stderr']}")
                    return False
                    
        except Exception as e:
            self.log_action("error", f"VPN stop failed: {str(e)}")
            return False
    
    def start_vpn_service(self, service_name, vpn_config=None):
        """Start VPN service"""
        try:
            if self.system == "windows":
                result = self.run_command(f'sc start "{service_name}"')
                if result["success"]:
                    self.log_action("vpn_started", f"Started Windows service: {service_name}")
                    return True
                else:
                    self.log_action("error", f"Failed to start {service_name}: {result['stderr']}")
                    return False
                    
            elif self.system == "linux":
                if service_name == "openvpn":
                    if vpn_config:
                        result = self.run_command(f"sudo systemctl start openvpn@{vpn_config}")
                    else:
                        result = self.run_command("sudo systemctl start openvpn")
                else:
                    # Find and connect to first available VPN
                    result = self.run_command("nmcli connection up $(nmcli connection show | grep vpn | head -1 | awk '{print $1}')")
                
                if result["success"]:
                    self.log_action("vpn_started", f"Started Linux VPN: {service_name}")
                    return True
                else:
                    self.log_action("error", f"Failed to start VPN: {result['stderr']}")
                    return False
                    
            elif self.system == "darwin":
                # Connect to first available VPN configuration
                result = self.run_command("sudo scutil --nc list | grep '\"' | head -1 | sed 's/\"//g' | xargs -I {} sudo scutil --nc start {}")
                if result["success"]:
                    self.log_action("vpn_started", "Connected VPN on macOS")
                    return True
                else:
                    self.log_action("error", f"Failed to connect VPN: {result['stderr']}")
                    return False
                    
        except Exception as e:
            self.log_action("error", f"VPN start failed: {str(e)}")
            return False
    
    def verify_vpn_connectivity(self):
        """Verify VPN connectivity"""
        try:
            # Check if we can reach internal network resources
            test_hosts = [
                "8.8.8.8",  # Google DNS (should always work)
                "1.1.1.1",   # Cloudflare DNS
                "10.0.0.1",   # Common internal gateway
                "192.168.1.1"  # Common router IP
            ]
            
            connectivity_results = {}
            
            for host in test_hosts:
                try:
                    # Test connectivity with ping
                    if self.system == "windows":
                        result = self.run_command(f'ping -n 2 {host}')
                    else:
                        result = self.run_command(f'ping -c 2 {host}')
                    
                    if result["success"]:
                        connectivity_results[host] = "reachable"
                    else:
                        connectivity_results[host] = "unreachable"
                        
                except Exception as e:
                    connectivity_results[host] = f"error: {str(e)}"
            
            # Check DNS resolution
            try:
                result = self.run_command("nslookup google.com")
                if result["success"]:
                    connectivity_results["dns"] = "working"
                else:
                    connectivity_results["dns"] = "failed"
            except:
                connectivity_results["dns"] = "error"
            
            self.log_action("connectivity_check", f"Connectivity test results: {connectivity_results}")
            
            return {
                "success": True,
                "results": connectivity_results,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.log_action("error", f"Connectivity verification failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def restart_vpn(self, parameters):
        """Main VPN restart function"""
        try:
            params = json.loads(parameters) if isinstance(parameters, str) else parameters
            vpn_service = params.get('vpn_service', 'auto')
            vpn_config = params.get('vpn_config', None)
            
            self.log_action("restart_initiated", f"Starting VPN restart (service: {vpn_service})")
            
            # Check current status
            status = self.check_vpn_status()
            self.log_action("initial_status", f"VPN status: {status['status']}")
            
            # Stop VPN if running
            if status["status"] == "running":
                service_to_stop = status["service"]
                if not self.stop_vpn_service(service_to_stop):
                    return {
                        "success": False,
                        "error": "Failed to stop VPN service",
                        "actions": self.actions
                    }
                
                # Wait for service to stop
                time.sleep(3)
            
            # Start VPN service
            service_to_start = vpn_service if vpn_service != 'auto' else status.get("service", "openvpn")
            
            if not self.start_vpn_service(service_to_start, vpn_config):
                return {
                    "success": False,
                    "error": "Failed to start VPN service",
                    "actions": self.actions
                }
            
            # Wait for service to start
            time.sleep(5)
            
            # Verify connectivity
            connectivity = self.verify_vpn_connectivity()
            
            # Check final status
            final_status = self.check_vpn_status()
            
            result = {
                "success": final_status["status"] == "running",
                "initial_status": status,
                "final_status": final_status,
                "connectivity_test": connectivity,
                "service_used": service_to_start,
                "actions": self.actions,
                "timestamp": datetime.now().isoformat()
            }
            
            if result["success"]:
                self.log_action("restart_success", "VPN restart completed successfully")
            else:
                self.log_action("restart_failed", "VPN restart failed")
            
            return result
            
        except Exception as e:
            self.log_action("restart_error", f"VPN restart failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "actions": self.actions
            }

def main():
    """Main function"""
    try:
        if len(sys.argv) < 2:
            print("Error: Missing parameters")
            sys.exit(1)
        
        parameters = sys.argv[1]
        vpn_manager = VPNRestart()
        result = vpn_manager.restart_vpn(parameters)
        
        print(json.dumps(result, indent=2))
        
        if result.get("success", False):
            sys.exit(0)
        else:
            sys.exit(1)
            
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
