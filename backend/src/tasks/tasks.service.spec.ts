import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task, TaskStatus } from './task.entity';
import { Repository, ObjectLiteral, DeleteResult } from 'typeorm';
import { UserProfile } from '../users/users.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: MockRepository<Task>;

  const mockUser: UserProfile = {
    id: 'user-uuid-123',
    username: 'testuser',
    tasks: [],
  };

  const createTaskRepositoryMock = (): MockRepository<Task> => ({
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: createTaskRepositoryMock(),
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<MockRepository<Task>>(getRepositoryToken(Task));

    taskRepository.create!.mockReset();
    taskRepository.save!.mockReset();
    taskRepository.findAndCount!.mockReset();
    taskRepository.findOneBy!.mockReset();
    taskRepository.delete!.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTask', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Nova Tarefa',
      description: 'Descrição da tarefa',
    };
    const taskEntityToSave = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: TaskStatus.PENDING,
      userId: mockUser.id,
    };
    const savedTaskEntity = {
      id: 'task-uuid-123',
      ...taskEntityToSave,
    };

    it('should successfully create and return a task', async () => {
      taskRepository.create!.mockReturnValue(taskEntityToSave);
      taskRepository.save!.mockResolvedValue(savedTaskEntity);

      const result = await service.createTask(createTaskDto, mockUser);

      expect(taskRepository.create).toHaveBeenCalledWith({
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status || TaskStatus.PENDING,
        userId: mockUser.id,
      });
      expect(taskRepository.save).toHaveBeenCalledWith(taskEntityToSave);
      expect(result).toEqual(savedTaskEntity);
    });

    it('should assign PENDING status if status is not provided in DTO', async () => {
      const dtoWithoutStatus: CreateTaskDto = { title: 'Tarefa Sem Status' };
      const taskEntity = {
        title: dtoWithoutStatus.title,
        description: undefined,
        status: TaskStatus.PENDING,
        userId: mockUser.id,
      };
      const savedEntity = { id: 'task-uuid-456', ...taskEntity };

      taskRepository.create!.mockReturnValue(taskEntity);
      taskRepository.save!.mockResolvedValue(savedEntity);

      await service.createTask(dtoWithoutStatus, mockUser);
      expect(taskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TaskStatus.PENDING,
        }),
      );
    });
  });

  describe('getTasks', () => {
    const paginationDto: PaginationQueryDto = { page: 1, limit: 10 };
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Tarefa 1',
        description: 'Desc 1',
        status: TaskStatus.PENDING,
        userId: mockUser.id,
        user: null as any,
      },
      {
        id: 'task-2',
        title: 'Tarefa 2',
        description: 'Desc 2',
        status: TaskStatus.DONE,
        userId: mockUser.id,
        user: null as any,
      },
    ];
    const totalTasks = mockTasks.length;

    it('should return paginated tasks for the user', async () => {
      taskRepository.findAndCount!.mockResolvedValue([mockTasks, totalTasks]);

      const result = await service.getTasks(mockUser, paginationDto);

      expect(taskRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        order: { status: 'ASC', title: 'ASC' },
        skip: (paginationDto.page! - 1) * paginationDto.limit!,
        take: paginationDto.limit,
      });
      expect(result.data).toEqual(mockTasks);
      expect(result.total).toBe(totalTasks);
      expect(result.page).toBe(paginationDto.page);
      expect(result.limit).toBe(paginationDto.limit);
    });

    it('should use default pagination values if not provided', async () => {
      const defaultPaginationDto: PaginationQueryDto = {};
      taskRepository.findAndCount!.mockResolvedValue([[], 0]);

      await service.getTasks(mockUser, defaultPaginationDto);

      expect(taskRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe('getTaskById', () => {
    const taskId = 'task-uuid-xyz';
    const taskEntity = {
      id: taskId,
      title: 'Test Task',
      description: 'Test Desc',
      status: TaskStatus.PENDING,
      userId: mockUser.id,
      user: null as any,
    };

    it('should return a task if found and belongs to the user', async () => {
      taskRepository.findOneBy!.mockResolvedValue(taskEntity);
      const result = await service.getTaskById(taskId, mockUser);
      expect(taskRepository.findOneBy).toHaveBeenCalledWith({
        id: taskId,
        userId: mockUser.id,
      });
      expect(result).toEqual(taskEntity);
    });

    it('should throw NotFoundException if task not found', async () => {
      taskRepository.findOneBy!.mockResolvedValue(null);
      await expect(service.getTaskById(taskId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if task found but does not belong to user (findOneBy returns null due to userId check)', async () => {
      taskRepository.findOneBy!.mockResolvedValue(null);
      await expect(service.getTaskById(taskId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTaskStatus', () => {
    const taskId = 'task-uuid-abc';
    const updateStatusDto: UpdateTaskStatusDto = { status: TaskStatus.DONE };
    const existingTask = {
      id: taskId,
      title: 'Task to Update Status',
      description: 'Old desc',
      status: TaskStatus.PENDING,
      userId: mockUser.id,
      user: null as any,
    };
    const updatedTaskEntity = { ...existingTask, status: TaskStatus.DONE };

    let getTaskByIdSpy: jest.SpyInstance;
    beforeEach(() => {
      getTaskByIdSpy = jest.spyOn(service, 'getTaskById');
    });

    it('should update task status successfully', async () => {
      jest
        .spyOn(service, 'getTaskById')
        .mockResolvedValueOnce(existingTask as Task);
      taskRepository.save!.mockResolvedValue(updatedTaskEntity);

      const result = await service.updateTaskStatus(
        taskId,
        updateStatusDto,
        mockUser,
      );

      expect(service.getTaskById).toHaveBeenCalledWith(taskId, mockUser);
      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: taskId, status: TaskStatus.DONE }),
      );
      expect(result).toEqual(updatedTaskEntity);
    });

    it('should throw NotFoundException if task to update status is not found (via getTaskById)', async () => {
      jest
        .spyOn(service, 'getTaskById')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        service.updateTaskStatus(taskId, updateStatusDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTask', () => {
    const taskId = 'task-uuid-def';
    const updateTaskDto: UpdateTaskDto = {
      title: 'Updated Title',
      description: 'Updated Description',
    };
    const existingTask = {
      id: taskId,
      title: 'Old Title',
      description: 'Old Desc',
      status: TaskStatus.PENDING,
      userId: mockUser.id,
      user: null as any,
    };
    const taskAfterTitleUpdate = {
      ...existingTask,
      title: updateTaskDto.title,
    };
    const finalUpdatedTask = {
      ...taskAfterTitleUpdate,
      description: updateTaskDto.description,
    };

    it('should update task details successfully', async () => {
      jest
        .spyOn(service, 'getTaskById')
        .mockResolvedValueOnce(existingTask as Task);
      taskRepository.save!.mockResolvedValue(finalUpdatedTask);

      const result = await service.updateTask(taskId, updateTaskDto, mockUser);

      expect(service.getTaskById).toHaveBeenCalledWith(taskId, mockUser);

      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: taskId,
          title: updateTaskDto.title,
          description: updateTaskDto.description,
        }),
      );
      expect(result).toEqual(finalUpdatedTask);
    });

    it('should only update provided fields', async () => {
      const partialUpdateDto: UpdateTaskDto = { title: 'Only Title Updated' };
      const taskAfterPartialUpdate = {
        ...existingTask,
        title: partialUpdateDto.title,
      };

      jest
        .spyOn(service, 'getTaskById')
        .mockResolvedValueOnce(existingTask as Task);
      taskRepository.save!.mockResolvedValue(taskAfterPartialUpdate);

      const result = await service.updateTask(
        taskId,
        partialUpdateDto,
        mockUser,
      );
      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: partialUpdateDto.title,
          description: existingTask.description,
        }),
      );
      expect(result.title).toEqual(partialUpdateDto.title);
      expect(result.description).toEqual(existingTask.description);
    });

    it('should throw NotFoundException if task to update is not found (via getTaskById)', async () => {
      jest
        .spyOn(service, 'getTaskById')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(
        service.updateTask(taskId, updateTaskDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTask', () => {
    const taskId = 'task-uuid-ghi';
    const existingTask = {
      id: taskId,
      title: 'Task to Delete',
      description: 'Desc',
      status: TaskStatus.PENDING,
      userId: mockUser.id,
      user: null as any,
    };

    it('should delete a task successfully', async () => {
      jest
        .spyOn(service, 'getTaskById')
        .mockResolvedValueOnce(existingTask as Task);

      const deleteResult: DeleteResult = { affected: 1, raw: [] };
      taskRepository.delete!.mockResolvedValue(deleteResult);

      await expect(
        service.deleteTask(taskId, mockUser),
      ).resolves.toBeUndefined();

      expect(service.getTaskById).toHaveBeenCalledWith(taskId, mockUser);
      expect(taskRepository.delete).toHaveBeenCalledWith({
        id: taskId,
        userId: mockUser.id,
      });
    });

    it('should throw NotFoundException if task to delete is not found (via getTaskById)', async () => {
      jest
        .spyOn(service, 'getTaskById')
        .mockRejectedValueOnce(new NotFoundException());
      await expect(service.deleteTask(taskId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if delete operation affects 0 rows', async () => {
      jest
        .spyOn(service, 'getTaskById')
        .mockResolvedValueOnce(existingTask as Task);
      const deleteResult: DeleteResult = { affected: 0, raw: [] };
      taskRepository.delete!.mockResolvedValue(deleteResult);

      await expect(service.deleteTask(taskId, mockUser)).rejects.toThrow(
        new NotFoundException(
          `Tarefa com ID "${taskId}" não encontrada para deleção.`,
        ),
      );
    });
  });
});
