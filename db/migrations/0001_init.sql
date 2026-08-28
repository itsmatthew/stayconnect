create table if not exists visits (
  id int primary key default 1,
  count int not null default 0,
  check (id = 1)
);

insert into visits (id, count)
values (1, 0)
on conflict (id) do nothing;
