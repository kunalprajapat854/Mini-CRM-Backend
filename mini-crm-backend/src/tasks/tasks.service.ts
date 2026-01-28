import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    const { assignedToId, customerId } = createTaskDto;

    // 1. Validate Assigned User exists and is an EMPLOYEE
    const assignedUser = await this.prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }
    if (assignedUser.role !== Role.EMPLOYEE) {
      throw new BadRequestException('Tasks can only be assigned to EMPLOYEES');
    }

    // 2. Validate Customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 3. Create Task
    return this.prisma.task.create({
      data: createTaskDto,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, company: true } },
      },
    });
  }

  async findAll(user: User) {
    // Logic: ADMIN sees all, EMPLOYEE sees own
    const whereCondition = user.role === Role.ADMIN ? {} : { assignedToId: user.id };

    return this.prisma.task.findMany({
      where: whereCondition,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, company: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, updateTaskStatusDto: UpdateTaskStatusDto, user: User) {
    // 1. Fetch task to check existence and ownership
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // 2. Ownership Check for EMPLOYEE
    if (user.role === Role.EMPLOYEE && task.assignedToId !== user.id) {
      throw new ForbiddenException('You are not authorized to update this task');
    }

    // 3. Update Status
    return this.prisma.task.update({
      where: { id },
      data: { status: updateTaskStatusDto.status },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, company: true } },
      },
    });
  }
}