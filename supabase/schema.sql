-- Chalist — Schema inicial
-- Ejecutar en Supabase SQL Editor

-- Sucursales
create table if not exists sucursales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  telefono text,
  encargado text,
  activa boolean default true,
  creado_at timestamptz default now()
);

-- Empleados
create table if not exists empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text,
  cargo text,
  sucursal_id uuid references sucursales(id),
  telefono text,
  email text,
  activo boolean default true,
  creado_at timestamptz default now()
);

-- Proveedores
create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  contacto text,
  telefono text,
  email text,
  rubro text,
  activo boolean default true,
  creado_at timestamptz default now()
);

-- Libros (Biblioteca de citas)
create table if not exists libros (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  autor text,
  anno int,
  portada_url text,
  creado_at timestamptz default now()
);

-- Entradas — tabla universal para tareas, temas, notas, fotos, citas
create table if not exists entradas (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('tarea', 'tema', 'nota', 'foto', 'cita')),
  titulo text,
  contenido text,
  -- Para cuaderno de campo: a qué entidad pertenece
  entidad_tipo text check (entidad_tipo in ('sucursal', 'empleado', 'proveedor', 'libro', 'general')),
  entidad_id uuid,
  -- Solo tareas
  vencimiento date,
  prioridad text check (prioridad in ('alta', 'media', 'baja')) default 'media',
  estado text check (estado in ('pendiente', 'en_progreso', 'completada')) default 'pendiente',
  -- Solo fotos/archivos
  archivo_url text,
  -- Solo citas de libros
  pagina int,
  reflexion text,
  -- Metadata
  creado_por text,
  creado_at timestamptz default now(),
  actualizado_at timestamptz default now()
);

-- Ideas
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  estado text check (estado in ('nueva', 'en_evaluacion', 'aprobada', 'descartada')) default 'nueva',
  prioridad text check (prioridad in ('alta', 'media', 'baja')) default 'media',
  convertida_a_proyecto boolean default false,
  proyecto_id uuid,
  creado_at timestamptz default now()
);

-- Proyectos
create table if not exists proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  estado text check (estado in ('planificacion', 'en_progreso', 'pausado', 'completado')) default 'planificacion',
  fecha_inicio date,
  fecha_fin date,
  progreso int default 0 check (progreso >= 0 and progreso <= 100),
  creado_at timestamptz default now()
);

-- Seed inicial: sucursales de Mobi
insert into sucursales (nombre, activa) values
  ('Casa Central', true),
  ('Mobi Junín', true),
  ('Urubi', true),
  ('Super Hogar', true),
  ('Mobi Oberá', true),
  ('El Dorado', true)
on conflict do nothing;
