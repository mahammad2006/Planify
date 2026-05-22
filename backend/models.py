from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class ShiftType(str, enum.Enum):
    morning = "morning"
    afternoon = "afternoon"

class RoomType(str, enum.Enum):
    regular = "regular"
    computer = "computer"
    laboratory = "laboratory"

class SubjectType(str, enum.Enum):
    normal = "normal"          # Adi dərs
    merged = "merged"          # Qruplar birləşir
    split = "split"            # Qrup yarıya bölünür

class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    student_count = Column(Integer, nullable=False)
    shift = Column(Enum(ShiftType), nullable=False)
    free_day = Column(Integer, nullable=True)  # 0=Bazar ertəsi...4=Cümə, None=avtomatik

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    room_type = Column(Enum(RoomType), default=RoomType.regular)

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    group_id = Column(Integer, ForeignKey("groups.id"))
    hours_per_week = Column(Integer, default=2)
    requires_computer = Column(Boolean, default=False)
    requires_laboratory = Column(Boolean, default=False)

    # Yeni sahələr
    subject_type = Column(Enum(SubjectType), default=SubjectType.normal)

    # Merged üçün: eyni merge_id olan fənlər eyni vaxtda keçilir
    merge_id = Column(String, nullable=True)

    # Split üçün: eyni split_id olan fənlər eyni qrupun yarılarıdır
    split_id = Column(String, nullable=True)
    split_student_count = Column(Integer, nullable=True)  # Bu yarının tələbə sayı

    teacher = relationship("Teacher")
    group = relationship("Group")

class Schedule(Base):
    __tablename__ = "schedule"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    room_id = Column(Integer, ForeignKey("rooms.id"))
    day = Column(Integer)
    time_slot = Column(Integer)
    shift = Column(Enum(ShiftType))

    subject = relationship("Subject")
    room = relationship("Room")