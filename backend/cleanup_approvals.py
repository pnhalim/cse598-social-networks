#!/usr/bin/env python3
"""
Utility script to clean up old approvals that don't result in mutual matches.
This can be run as a scheduled task (e.g., daily via cron).
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.models import UserApproval
from sqlalchemy import and_
from datetime import datetime, timedelta

def cleanup_old_approvals(days_old=7):
    """
    Remove approvals/rejections that are more than specified days old and don't result in mutual matching.
    
    Args:
        days_old (int): Number of days old to consider for cleanup (default: 7)
    
    Returns:
        int: Number of approvals deleted
    """
    db = SessionLocal()
    
    try:
        # Calculate cutoff date
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Find all approvals older than cutoff date
        old_approvals = db.query(UserApproval).filter(
            UserApproval.created_at < cutoff_date
        ).all()
        
        deleted_count = 0
        
        for approval in old_approvals:
            # Check if this approval results in a mutual match
            approver_id = approval.approver_id
            approved_user_id = approval.approved_user_id
            
            # Check if there's a reverse approval (mutual match)
            reverse_approval = db.query(UserApproval).filter(
                and_(
                    UserApproval.approver_id == approved_user_id,
                    UserApproval.approved_user_id == approver_id,
                    UserApproval.is_approved == True
                )
            ).first()
            
            # If there's no reverse approval, this approval doesn't result in a mutual match
            # and can be safely deleted
            if not reverse_approval:
                db.delete(approval)
                deleted_count += 1
        
        db.commit()
        print(f"Successfully cleaned up {deleted_count} old approvals that didn't result in mutual matches.")
        return deleted_count
        
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {str(e)}")
        return 0
    finally:
        db.close()

def get_approval_stats():
    """Get statistics about current approvals in the database"""
    db = SessionLocal()
    
    try:
        total_approvals = db.query(UserApproval).count()
        
        # Count approvals by age
        now = datetime.utcnow()
        one_day_ago = now - timedelta(days=1)
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)
        
        recent_approvals = db.query(UserApproval).filter(
            UserApproval.created_at >= one_day_ago
        ).count()
        
        week_old_approvals = db.query(UserApproval).filter(
            and_(
                UserApproval.created_at >= seven_days_ago,
                UserApproval.created_at < one_day_ago
            )
        ).count()
        
        old_approvals = db.query(UserApproval).filter(
            UserApproval.created_at < seven_days_ago
        ).count()
        
        print(f"Approval Statistics:")
        print(f"  Total approvals: {total_approvals}")
        print(f"  Last 24 hours: {recent_approvals}")
        print(f"  1-7 days old: {week_old_approvals}")
        print(f"  Older than 7 days: {old_approvals}")
        
        return {
            "total": total_approvals,
            "recent": recent_approvals,
            "week_old": week_old_approvals,
            "old": old_approvals
        }
        
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Clean up old approvals that don't result in mutual matches")
    parser.add_argument("--days", type=int, default=7, help="Number of days old to consider for cleanup (default: 7)")
    parser.add_argument("--stats", action="store_true", help="Show approval statistics instead of cleaning up")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be deleted without actually deleting")
    
    args = parser.parse_args()
    
    if args.stats:
        get_approval_stats()
    else:
        if args.dry_run:
            print(f"DRY RUN: Would clean up approvals older than {args.days} days")
            # In a real dry run, you'd query and count without deleting
            db = SessionLocal()
            try:
                cutoff_date = datetime.utcnow() - timedelta(days=args.days)
                old_approvals = db.query(UserApproval).filter(
                    UserApproval.created_at < cutoff_date
                ).count()
                print(f"Found {old_approvals} approvals older than {args.days} days")
            finally:
                db.close()
        else:
            deleted_count = cleanup_old_approvals(args.days)
            print(f"Cleanup completed. Deleted {deleted_count} old approvals.")
