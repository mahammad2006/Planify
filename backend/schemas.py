from pydantic import BaseModel
from typing import Optional
from enum import Enum

class ShiftType(str, Enum):
    morning = "morning"
    afternoon = "afternoon"

class RoomType(str, Enum):
    regular = "regular"
    computer = "computer"
    laboratory = "laboratory"

class SubjectType(str, Enum):
    normal = "normal"
    merged = "merged"
    split = "split"

# ── Qruplar ──
class GroupBase(BaseModel):
    name: str
    student_count: int
    shift: ShiftType
    free_day: Optional[int] = None  # None=avtomatik, 0-4=spesifik gün

class GroupCreate(GroupBase):
    pass

class Group(GroupBase):
    id: int
    class Config:
        from_attributes = True

# ── Müəllimlər ──
class TeacherBase(BaseModel):
    full_name: str
    email: Optional[str] = None

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: int
    class Config:
        from_attributes = True

# ── Otaqlar ──
class RoomBase(BaseModel):
    name: str
    capacity: int
    room_type: RoomType = RoomType.regular

class RoomCreate(RoomBase):
    pass

class Room(RoomBase):
    id: int
    class Config:
        from_attributes = True

# ── Fənlər ──
class SubjectBase(BaseModel):
    name: str
    teacher_id: int
    group_id: int
    hours_per_week: int = 2
    requires_computer: bool = False
    requires_laboratory: bool = False
    subject_type: SubjectType = SubjectType.normal
    merge_id: Optional[str] = None
    split_id: Optional[str] = None
    split_student_count: Optional[int] = None

class SubjectCreate(SubjectBase):
    pass

class Subject(SubjectBase):
    id: int
    class Config:
        from_attributes = True

# ── Cədvəl ──
class ScheduleBase(BaseModel):
    subject_id: int
    room_id: int
    day: int
    time_slot: int
    shift: ShiftType

class ScheduleCreate(ScheduleBase):
    pass

class Schedule(ScheduleBase):
    id: int
    class Config:
        from_attributes = True