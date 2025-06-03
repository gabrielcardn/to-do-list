// src/users/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from 'typeorm'; // Adicione OneToMany
import { Task } from '../tasks/task.entity'; // Importe a entidade Task

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  // Relacionamento: Um usuário pode ter muitas tarefas
  @OneToMany(() => Task, (task) => task.user, { eager: true }) // eager: true pode ser útil se você sempre quer as tarefas ao carregar um usuário, ou false para carregar sob demanda
  tasks: Task[]; // Um array de tarefas
}