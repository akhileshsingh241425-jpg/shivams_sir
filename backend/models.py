from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date

db = SQLAlchemy()


class Equipment(db.Model):
    """Master equipment registry - mirrors the 'Master' sheet"""
    __tablename__ = 'equipment'

    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.String(100), unique=True, nullable=False)  # e.g. "Stringer-1-A"
    factory_section = db.Column(db.String(100))  # Pre-Lamination Area, Lamination Area, Post-Lamination Area
    equipment_name = db.Column(db.String(100))  # Stringer, Layup, Laminator, etc.
    line = db.Column(db.String(10))  # A, B, C, PDI
    equipment_criticality = db.Column(db.String(50))  # Critical, Non-Critical
    overall_pm_status = db.Column(db.String(20))  # Green, Orange, Red
    overdue_pm_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    tasks = db.relationship('PMTask', backref='equipment', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'factory_section': self.factory_section,
            'equipment_name': self.equipment_name,
            'line': self.line,
            'equipment_criticality': self.equipment_criticality,
            'overall_pm_status': self.overall_pm_status,
            'overdue_pm_count': self.overdue_pm_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PMTask(db.Model):
    """PM Tasks for each equipment - mirrors individual equipment sheets"""
    __tablename__ = 'pm_tasks'

    id = db.Column(db.Integer, primary_key=True)
    equipment_db_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    task_no = db.Column(db.Integer)
    pm_task_description = db.Column(db.Text)
    frequency_days = db.Column(db.Integer)  # Frequency in days
    tolerance_days = db.Column(db.Integer)  # Tolerance in days
    next_due_date = db.Column(db.Date)
    status = db.Column(db.String(20))  # Pending, Done, Overdue
    actual_done_date = db.Column(db.Date)
    consumables = db.Column(db.Text)
    spare_parts = db.Column(db.Text)
    done_by = db.Column(db.String(100))
    verified_by = db.Column(db.String(100))
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def compute_status(self):
        """Auto-compute status based on next_due_date"""
        if self.actual_done_date:
            return 'Done'
        if not self.next_due_date:
            return 'Pending'
        today = date.today()
        tolerance = self.tolerance_days or 0
        due_with_tolerance = self.next_due_date
        days_diff = (today - due_with_tolerance).days
        if days_diff > 0:
            return 'Overdue'
        return 'Pending'

    def to_dict(self):
        return {
            'id': self.id,
            'equipment_db_id': self.equipment_db_id,
            'task_no': self.task_no,
            'pm_task_description': self.pm_task_description,
            'frequency_days': self.frequency_days,
            'tolerance_days': self.tolerance_days,
            'next_due_date': self.next_due_date.isoformat() if self.next_due_date else None,
            'status': self.status or self.compute_status(),
            'actual_done_date': self.actual_done_date.isoformat() if self.actual_done_date else None,
            'consumables': self.consumables,
            'spare_parts': self.spare_parts,
            'done_by': self.done_by,
            'verified_by': self.verified_by,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class PMHistory(db.Model):
    """PM History log - mirrors the 'PM_History' sheet"""
    __tablename__ = 'pm_history'

    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.String(100), nullable=False)  # Equipment ID string
    task_no = db.Column(db.Integer)
    pm_task = db.Column(db.Text)
    frequency_days = db.Column(db.Integer)
    tolerance_days = db.Column(db.Integer)
    old_next_due_date = db.Column(db.Date)
    actual_done_date = db.Column(db.Date)
    consumables = db.Column(db.Text)
    spare_parts = db.Column(db.Text)
    done_by = db.Column(db.String(100))
    verified_by = db.Column(db.String(100))
    remarks = db.Column(db.Text)
    completion_timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'task_no': self.task_no,
            'pm_task': self.pm_task,
            'frequency_days': self.frequency_days,
            'tolerance_days': self.tolerance_days,
            'old_next_due_date': self.old_next_due_date.isoformat() if self.old_next_due_date else None,
            'actual_done_date': self.actual_done_date.isoformat() if self.actual_done_date else None,
            'consumables': self.consumables,
            'spare_parts': self.spare_parts,
            'done_by': self.done_by,
            'verified_by': self.verified_by,
            'remarks': self.remarks,
            'completion_timestamp': self.completion_timestamp.isoformat() if self.completion_timestamp else None
        }
