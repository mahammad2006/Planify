from sqlalchemy.orm import Session
from collections import defaultdict
import models

DAYS = 5
SLOTS_PER_DAY = 5

def generate_schedule(db: Session):
    groups   = db.query(models.Group).all()
    teachers = db.query(models.Teacher).all()
    rooms    = db.query(models.Room).all()
    subjects = db.query(models.Subject).all()

    if not subjects:
        return {"error": "Fənn tapılmadı"}
    if not rooms:
        return {"error": "Otaq tapılmadı"}

    # Dərs nüsxələri
    lessons = []
    for subj in subjects:
        for k in range(subj.hours_per_week):
            lessons.append((subj, k))

    # Qalan dərs sayları
    teacher_remaining = defaultdict(int)
    group_remaining = defaultdict(int)
    for subj, k in lessons:
        teacher_remaining[subj.teacher_id] += 1
        group_remaining[subj.group_id] += 1

    # Məşğul slotlar
    # Avtomatik boş gün təyini — optimal seçim
    # Qrupları növbəli olaraq müxtəlif günlərə paylaşdır
    auto_free_days = {}
    day_load = defaultdict(int)  # neçə qrup həmin günü boş saxlayır
    for group in groups:
        if group.free_day is None:
            # Ən az yüklü günü seç
            best_day = min(range(DAYS), key=lambda d: day_load[d])
            auto_free_days[group.id] = best_day
            day_load[best_day] += 1
        elif group.free_day == -1:
            auto_free_days[group.id] = None  # boş gün yoxdur
        else:
            auto_free_days[group.id] = group.free_day
    placed = {}
    subj_days = defaultdict(set)
    room_busy = defaultdict(set)
    group_busy = defaultdict(set)
    teacher_busy = defaultdict(set)
    group_day_count = defaultdict(int)

    remaining = list(lessons)

    # Sıra: 1-ci gün 1-ci saat, 2-ci gün 1-ci saat ... 5-ci gün 1-ci saat,
    #       1-ci gün 2-ci saat ...
    slot_order = [(d, s) for s in range(SLOTS_PER_DAY) for d in range(DAYS)]

    for (day, slot) in slot_order:
        if not remaining:
            break

        # Bu slotda istifadə edilənlər
        used_rooms    = set()
        used_groups   = set()
        used_teachers = set()
        placed_now    = set()

        # Müəllimləri qalan dərs sayına görə sırala (çoxdan aza)
        teacher_order = sorted(
            set(subj.teacher_id for (subj, k) in remaining),
            key=lambda tid: -teacher_remaining[tid]
        )

        for teacher_id in teacher_order:
            # Bu müəllim bu slotda artıq məşğuldursa keç
            if teacher_id in used_teachers:
                continue
            if (day, slot) in teacher_busy[teacher_id]:
                continue

            # Bu müəllimin bu slotda keçə biləcəyi dərslər
            teacher_lessons = [
                (subj, k) for (subj, k) in remaining
                if subj.teacher_id == teacher_id
                and subj.group_id not in used_groups
                and (day, slot) not in group_busy[subj.group_id]
                and day not in subj_days[subj.id]
                and group_day_count[(subj.group_id, day)] < 3
            ]

            if not teacher_lessons:
                continue

            # Split constraint yoxla
            filtered = []
            for (subj, k) in teacher_lessons:
                if subj.subject_type == models.SubjectType.split and subj.split_id:
                    siblings = [
                        su for su in subjects
                        if su.split_id == subj.split_id and su.id != subj.id
                    ]
                    if any(day in subj_days[sib.id] for sib in siblings):
                        continue
                # Boş gün yoxla
                free = auto_free_days.get(subj.group_id)
                if free is not None and free == day:
                    continue
                filtered.append((subj, k))

            if not filtered:
                continue

            # Qrupları qalan dərs sayına görə sırala
            filtered.sort(
                key=lambda lsn: -group_remaining[lsn[0].group_id]
            )

            # Ən yüksək prioritetli dərsi seç
            chosen = None
            chosen_room = None
            for (subj, k) in filtered:
                if subj.group_id in used_groups:
                    continue

                # Tələbə sayı
                grp = next((g for g in groups if g.id == subj.group_id), None)
                if not grp:
                    continue

                if subj.subject_type == models.SubjectType.split and subj.split_student_count:
                    required = subj.split_student_count
                elif subj.subject_type == models.SubjectType.merged and subj.merge_id:
                    merged_subjs = [su for su in subjects if su.merge_id == subj.merge_id]
                    required = sum(
                        next((g.student_count for g in groups if g.id == su.group_id), 0)
                        for su in merged_subjs
                    )
                else:
                    required = grp.student_count

                # Uyğun otaq tap
                room = None
                for r in rooms:
                    if r.id in used_rooms:
                        continue
                    if (day, slot) in room_busy[r.id]:
                        continue
                    if r.capacity < required:
                        continue
                    if subj.requires_computer and r.room_type != models.RoomType.computer:
                        continue
                    if subj.requires_laboratory and r.room_type != models.RoomType.laboratory:
                        continue
                    room = r
                    break

                if room is None:
                    continue

                chosen = (subj, k)
                chosen_room = room
                break

            if chosen is None:
                continue

            subj, k = chosen
            room = chosen_room

            # Yerləşdir
            placed[(subj.id, k)] = (day, slot, room.id)
            room_busy[room.id].add((day, slot))
            group_busy[subj.group_id].add((day, slot))
            teacher_busy[subj.teacher_id].add((day, slot))
            group_day_count[(subj.group_id, day)] += 1
            subj_days[subj.id].add(day)
            teacher_remaining[subj.teacher_id] -= 1
            group_remaining[subj.group_id] -= 1
            placed_now.add((subj.id, k))
            used_rooms.add(room.id)
            used_groups.add(subj.group_id)
            used_teachers.add(subj.teacher_id)

        remaining = [(s, k) for (s, k) in remaining if (s.id, k) not in placed_now]

    # Bazaya yaz
    db.query(models.Schedule).delete()
    db.commit()

    day_names = ["Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə"]
    result = []

    for subj in subjects:
        group = next(g for g in groups if g.id == subj.group_id)
        for k in range(subj.hours_per_week):
            key = (subj.id, k)
            if key not in placed:
                continue
            day, slot, room_id = placed[key]
            room = next(r for r in rooms if r.id == room_id)

            if subj.subject_type == models.SubjectType.merged and subj.merge_id:
                merged_grps = [su for su in subjects if su.merge_id == subj.merge_id]
                group_name = " + ".join(
                    next(g.name for g in groups if g.id == su.group_id)
                    for su in merged_grps
                )
            elif subj.subject_type == models.SubjectType.split and subj.split_id:
                split_subjs = [su for su in subjects if su.split_id == subj.split_id]
                idx = split_subjs.index(subj)
                yarim = "A" if idx == 0 else "B"
                group_name = f"{group.name}-{yarim} ({subj.split_student_count} nəfər)"
            else:
                group_name = group.name

            entry = models.Schedule(
                subject_id=subj.id,
                room_id=room.id,
                day=day,
                time_slot=slot,
                shift=group.shift
            )
            db.add(entry)
            result.append({
                "subject": subj.name,
                "teacher": next(t.full_name for t in teachers if t.id == subj.teacher_id),
                "group": group_name,
                "room": room.name,
                "day": day_names[day],
                "slot": slot + 1,
                "shift": group.shift
            })

    db.commit()
    not_placed = len(remaining)
    return {
        "schedule": result,
        "total": len(result),
        "not_placed": not_placed
    }