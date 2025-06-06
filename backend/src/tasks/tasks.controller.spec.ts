import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateTaskDto } from './dto/create-task.dto';
import { UserProfile } from '../users/users.service';
import { Task, TaskStatus } from './task.entity';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const mockUser: UserProfile = {
  id: 'user-uuid-123',
  username: 'testuser',
  tasks: [],
};

const mockTasksService = {
  createTask: jest.fn(),
  getTasks: jest.fn(),
  getTaskById: jest.fn(),
  updateTaskStatus: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
};

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);

    mockTasksService.createTask.mockReset();
    mockTasksService.getTasks.mockReset();
    mockTasksService.getTaskById.mockReset();
    mockTasksService.updateTaskStatus.mockReset();
    mockTasksService.updateTask.mockReset();
    mockTasksService.deleteTask.mockReset();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTask', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Nova Tarefa Controller',
      description: 'Desc Controller',
    };
    const expectedTask = {
      id: 'task-uuid-controller',
      ...createTaskDto,
      status: TaskStatus.PENDING,
      userId: mockUser.id,
      user: null as any,
    } as Task;

    it('should call tasksService.createTask and return the created task', async () => {
      mockTasksService.createTask.mockResolvedValue(expectedTask);

      const result = await controller.createTask(createTaskDto, mockUser);

      expect(service.createTask).toHaveBeenCalledWith(createTaskDto, mockUser);
      expect(result).toEqual(expectedTask);
    });
  });

  describe('getTasks', () => {
    const paginationDto: PaginationQueryDto = { page: 1, limit: 5 };
    const mockTasksResult = {
      data: [
        {
          id: 'task-1',
          title: 'Tarefa 1',
          description: 'Desc 1',
          status: TaskStatus.PENDING,
          userId: mockUser.id,
          user: null as any,
        } as Task,
      ],
      total: 1,
      page: 1,
      limit: 5,
    };

    it('should call tasksService.getTasks and return paginated tasks', async () => {
      mockTasksService.getTasks.mockResolvedValue(mockTasksResult);

      const result = await controller.getTasks(paginationDto, mockUser);

      expect(service.getTasks).toHaveBeenCalledWith(mockUser, paginationDto);
      expect(result).toEqual(mockTasksResult);
    });
  });

  describe('getTaskById', () => {
    const taskId = 'some-task-id';
    const expectedTask = {
      id: taskId,
      title: 'Specific Task',
      userId: mockUser.id,
    } as Task;

    it('should call tasksService.getTaskById and return the task', async () => {
      mockTasksService.getTaskById.mockResolvedValue(expectedTask);
      const result = await controller.getTaskById(taskId, mockUser);
      expect(service.getTaskById).toHaveBeenCalledWith(taskId, mockUser);
      expect(result).toEqual(expectedTask);
    });
  });

  describe('updateTaskStatus', () => {
    const taskId = 'some-task-id';
    const updateStatusDto: UpdateTaskStatusDto = { status: TaskStatus.DONE };
    const expectedTask = {
      id: taskId,
      title: 'Task',
      status: TaskStatus.DONE,
      userId: mockUser.id,
    } as Task;

    it('should call tasksService.updateTaskStatus and return the updated task', async () => {
      mockTasksService.updateTaskStatus.mockResolvedValue(expectedTask);
      const result = await controller.updateTaskStatus(
        taskId,
        updateStatusDto,
        mockUser,
      );
      expect(service.updateTaskStatus).toHaveBeenCalledWith(
        taskId,
        updateStatusDto,
        mockUser,
      );
      expect(result).toEqual(expectedTask);
    });
  });

  describe('updateTask', () => {
    const taskId = 'some-task-id';
    const updateTaskDto: UpdateTaskDto = { title: 'Updated Title' };
    const expectedTask = {
      id: taskId,
      title: 'Updated Title',
      userId: mockUser.id,
    } as Task;

    it('should call tasksService.updateTask and return the updated task', async () => {
      mockTasksService.updateTask.mockResolvedValue(expectedTask);
      const result = await controller.updateTask(
        taskId,
        updateTaskDto,
        mockUser,
      );
      expect(service.updateTask).toHaveBeenCalledWith(
        taskId,
        updateTaskDto,
        mockUser,
      );
      expect(result).toEqual(expectedTask);
    });
  });

  describe('deleteTask', () => {
    const taskId = 'some-task-id';

    it('should call tasksService.deleteTask and return void', async () => {
      mockTasksService.deleteTask.mockResolvedValue(undefined);

      await controller.deleteTask(taskId, mockUser);

      expect(service.deleteTask).toHaveBeenCalledWith(taskId, mockUser);
    });
  });
});
