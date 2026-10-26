-- Migración: agregar tipo 'doc' a la tabla entradas
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar el check constraint actual
ALTER TABLE entradas DROP CONSTRAINT IF EXISTS entradas_tipo_check;

-- 2. Agregar nuevo check que incluye 'doc'
ALTER TABLE entradas ADD CONSTRAINT entradas_tipo_check
  CHECK (tipo IN ('tarea', 'tema', 'nota', 'foto', 'cita', 'doc'));
