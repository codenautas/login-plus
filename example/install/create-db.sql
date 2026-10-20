create user codenautas_user password 'example3092929';
create database codenautas_db owner codenautas_user;
\c codenautas_db

drop schema if exists example cascade;
create schema example authorization codenautas_user;
grant all on schema example to codenautas_user;

create table example."users" (
  "user" text primary key,
  active boolean default false,
  pass_sha256 text
);
alter table example."users" owner to codenautas_user;

-- the password of every example user is prueba1; the hash is sha256(password || user), the same as passwordHash in server.js
insert into example."users"("user", active, pass_sha256)
  select u."user", u.active, encode(sha256(convert_to(p.pass || u."user", 'UTF8')), 'hex')
    from (values
      ('emilio', true),
      ('estefania', true),
      ('diegoefe', true),
      ('prueba', true),
      ('inactivo', false)
    ) as u("user", active),
    (select 'prueba1' as pass) as p;

-- user with an invalid hash: it cannot log in
insert into example."users"("user", active, pass_sha256) values
   ('sinclave', true, 'sarasasasasas');
