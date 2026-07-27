import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  subtasks?: Array<{ id?: string; title: string; completed?: boolean }>;
}
