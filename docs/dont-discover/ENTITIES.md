# Entities

## Fields

* User: standard laravel + role, avatar, is_active
* Person: id, name, photo, is_active
* Building: id, name, is_active
* Room: id, name, building_id, capacity, is_active
* RoomGroup: id, name, is_active
* Media: id, type, name, path, size, mime, sort_order, is_active
* OshLevel: id, name, min_participants, max_participants, sort_order, is_active
* Booking: id, title, description, start_time, end_time, participants_count, attachment_path, qr_attendance_path, reason, status, room_id, chairperson_id, requested_id, approved_id, approved_at

## Relationships

* Room [One To Many (Inverse)] Building
* Room [One To Many (Polymorphic)] Media (including pivot field:sort_order, is_active)
* RoomGroup [One To Many (Inverse)] Building
* RoomGroup [One To Many (Polymorphic)] Media (including pivot field:sort_order, is_active)
* RoomGroup [Many To Many] Room
* Booking [One To Many (Inverse)] Room
* Booking [One To Many (Inverse)] Person as chairperson
* Booking [One To Many (Inverse)] User as requested_by
* Booking [One To Many (Inverse)] User as approved_by

notes: add fk if doesnt exists in this docs, and always add laravel timestamps column scheme in every entities
