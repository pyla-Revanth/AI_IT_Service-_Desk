#!/usr/bin/env python3
"""
Disk Cleanup Automation Script
Cleans temporary files and frees up disk space
"""

import os
import sys
import json
import shutil
import tempfile
import platform
import time
from datetime import datetime

class DiskCleanup:
    def __init__(self):
        self.system = platform.system().lower()
        self.cleanup_results = []
        
    def log_action(self, action, details):
        """Log cleanup actions"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "action": action,
            "details": details
        }
        self.cleanup_results.append(log_entry)
        print(f"[{timestamp}] {action}: {details}")
        
    def get_disk_usage(self):
        """Get current disk usage"""
        try:
            if self.system == "windows":
                import psutil
                disk = psutil.disk_usage('/')
                return {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent_used": (disk.used / disk.total) * 100
                }
            else:
                stat = os.statvfs('/')
                total = stat.f_blocks * stat.f_frsize
                free = stat.f_bavail * stat.f_frsize
                used = total - free
                return {
                    "total": total,
                    "used": used,
                    "free": free,
                    "percent_used": (used / total) * 100
                }
        except Exception as e:
            self.log_action("error", f"Failed to get disk usage: {str(e)}")
            return None
    
    def clean_temp_files(self):
        """Clean temporary files"""
        cleaned_size = 0
        
        try:
            # Clean system temp directory
            temp_dir = tempfile.gettempdir()
            if os.path.exists(temp_dir):
                for item in os.listdir(temp_dir):
                    item_path = os.path.join(temp_dir, item)
                    try:
                        if os.path.isfile(item_path):
                            size = os.path.getsize(item_path)
                            os.remove(item_path)
                            cleaned_size += size
                            self.log_action("file_deleted", f"Removed temp file: {item}")
                        elif os.path.isdir(item_path):
                            shutil.rmtree(item_path)
                            self.log_action("directory_deleted", f"Removed temp directory: {item}")
                    except Exception as e:
                        self.log_action("warning", f"Could not delete {item_path}: {str(e)}")
            
            # Clean user temp directories on Windows
            if self.system == "windows":
                import getpass
                user_temp = os.path.join(os.environ.get('TEMP', 'C:\\Windows\\Temp'))
                if os.path.exists(user_temp):
                    for item in os.listdir(user_temp):
                        try:
                            item_path = os.path.join(user_temp, item)
                            if os.path.isfile(item_path):
                                size = os.path.getsize(item_path)
                                os.remove(item_path)
                                cleaned_size += size
                        except Exception as e:
                            self.log_action("warning", f"Could not delete user temp file: {str(e)}")
                            
        except Exception as e:
            self.log_action("error", f"Temp file cleanup failed: {str(e)}")
            
        return cleaned_size
    
    def clean_browser_cache(self):
        """Clean browser cache directories"""
        cleaned_size = 0
        
        try:
            home = os.path.expanduser("~")
            
            # Common browser cache paths
            cache_paths = [
                os.path.join(home, "AppData", "Local", "Google", "Chrome", "User Data", "Default", "Cache"),
                os.path.join(home, "AppData", "Local", "Microsoft", "Edge", "User Data", "Default", "Cache"),
                os.path.join(home, ".cache", "mozilla", "firefox"),
                os.path.join(home, ".cache", "google-chrome")
            ]
            
            for cache_path in cache_paths:
                if os.path.exists(cache_path):
                    try:
                        size_before = sum(os.path.getsize(os.path.join(dirpath, filename)) 
                                       for dirpath, dirnames, filenames in os.walk(cache_path) 
                                       for filename in filenames)
                        
                        shutil.rmtree(cache_path)
                        cleaned_size += size_before
                        self.log_action("cache_cleaned", f"Cleaned browser cache: {cache_path}")
                    except Exception as e:
                        self.log_action("warning", f"Could not clean cache {cache_path}: {str(e)}")
                        
        except Exception as e:
            self.log_action("error", f"Browser cache cleanup failed: {str(e)}")
            
        return cleaned_size
    
    def clean_log_files(self, days_old=7):
        """Clean old log files"""
        cleaned_size = 0
        
        try:
            current_time = time.time()
            cutoff_time = current_time - (days_old * 24 * 60 * 60)
            
            log_paths = []
            
            if self.system == "windows":
                log_paths.extend([
                    "C:\\Windows\\Logs",
                    "C:\\Windows\\debug",
                    "C:\\ProgramData\\Microsoft\\Windows\\WER\\ReportArchive"
                ])
            else:
                log_paths.extend([
                    "/var/log",
                    os.path.expanduser("~/.local/share/logs")
                ])
            
            for log_path in log_paths:
                if os.path.exists(log_path):
                    for root, dirs, files in os.walk(log_path):
                        for file in files:
                            if file.endswith(('.log', '.out', '.err')):
                                file_path = os.path.join(root, file)
                                try:
                                    file_time = os.path.getmtime(file_path)
                                    if file_time < cutoff_time:
                                        size = os.path.getsize(file_path)
                                        os.remove(file_path)
                                        cleaned_size += size
                                        self.log_action("log_deleted", f"Removed old log: {file_path}")
                                except Exception as e:
                                    self.log_action("warning", f"Could not delete log {file_path}: {str(e)}")
                                    
        except Exception as e:
            self.log_action("error", f"Log file cleanup failed: {str(e)}")
            
        return cleaned_size
    
    def empty_recycle_bin(self):
        """Empty recycle bin (Windows only)"""
        if self.system != "windows":
            return 0
            
        try:
            import winshell
            winshell.recycle_bin().empty(confirm=False, show_progress=False, sound=False)
            self.log_action("recycle_emptied", "Windows recycle bin emptied")
            return 0  # Size calculation not available
        except Exception as e:
            self.log_action("warning", f"Could not empty recycle bin: {str(e)}")
            return 0
    
    def format_bytes(self, bytes_value):
        """Format bytes to human readable format"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.2f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.2f} PB"
    
    def run_cleanup(self, parameters):
        """Main cleanup function"""
        try:
            params = json.loads(parameters) if isinstance(parameters, str) else parameters
            min_free_space_gb = params.get('min_free_space_gb', 5)
            
            self.log_action("cleanup_started", f"Starting disk cleanup (min free space: {min_free_space_gb}GB)")
            
            # Get initial disk usage
            initial_usage = self.get_disk_usage()
            if not initial_usage:
                raise Exception("Could not get disk usage information")
            
            self.log_action("disk_usage_initial", 
                          f"Total: {self.format_bytes(initial_usage['total'])}, "
                          f"Used: {self.format_bytes(initial_usage['used'])}, "
                          f"Free: {self.format_bytes(initial_usage['free'])} "
                          f"({initial_usage['percent_used']:.1f}%)")
            
            # Check if cleanup is needed
            free_gb = initial_usage['free'] / (1024**3)
            if free_gb >= min_free_space_gb:
                self.log_action("cleanup_skipped", f"Sufficient free space ({free_gb:.1f}GB >= {min_free_space_gb}GB)")
                return self.generate_result(initial_usage, 0)
            
            # Perform cleanup operations
            total_cleaned = 0
            
            # Clean temporary files
            temp_cleaned = self.clean_temp_files()
            total_cleaned += temp_cleaned
            
            # Clean browser cache
            cache_cleaned = self.clean_browser_cache()
            total_cleaned += cache_cleaned
            
            # Clean old log files
            log_cleaned = self.clean_log_files()
            total_cleaned += log_cleaned
            
            # Empty recycle bin (Windows)
            recycle_cleaned = self.empty_recycle_bin()
            
            # Get final disk usage
            final_usage = self.get_disk_usage()
            
            self.log_action("cleanup_completed", 
                          f"Cleaned {self.format_bytes(total_cleaned)} total")
            
            return self.generate_result(final_usage, total_cleaned)
            
        except Exception as e:
            self.log_action("cleanup_failed", f"Cleanup failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "actions": self.cleanup_results
            }
    
    def generate_result(self, disk_usage, cleaned_bytes):
        """Generate cleanup result"""
        return {
            "success": True,
            "disk_usage": disk_usage,
            "cleaned_bytes": cleaned_bytes,
            "cleaned_human": self.format_bytes(cleaned_bytes),
            "free_space_gb": disk_usage['free'] / (1024**3),
            "actions": self.cleanup_results,
            "timestamp": datetime.now().isoformat()
        }

def main():
    """Main function"""
    try:
        if len(sys.argv) < 2:
            print("Error: Missing parameters")
            sys.exit(1)
        
        parameters = sys.argv[1]
        cleaner = DiskCleanup()
        result = cleaner.run_cleanup(parameters)
        
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
