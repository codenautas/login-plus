create user codenautas_user password 'example3092929';
create database codenautas_db owner codenautas_user;
\c codenautas_db

drop schema if exists example cascade;
create schema example authorization codenautas_user;
grant all on schema example to codenautas_user;

create table example."users" (
  "user" text primary key,
  active boolean default false,
  pass_md5 text
);
alter table example."users" owner to codenautas_user;

insert into example."users"("user", active, pass_md5) values 
   ('emilio', true, md5('prueba1'||'emilio')),
   ('estefania', true, md5('prueba1'||'estefania')),
   ('diegoefe', true, md5('prueba1'||'diegoefe')),
   ('prueba', true, md5('prueba1'||'prueba')),
   ('sinclave', true, 'sarasasasasas'),
   ('inactivo', false, md5('prueba1'||'inactivo'));