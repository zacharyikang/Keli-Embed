-- Directions
insert into directions (slug, name, description, display_order) values
  ('c-language', 'C/C++ 基础', '指针、内存、编译、关键字', 1),
  ('mcu', 'MCU 与硬件', '微控制器、外设、中断', 2),
  ('rtos', 'RTOS 与实时系统', 'FreeRTOS、任务调度、IPC', 3),
  ('protocol', '通信协议', 'I2C、SPI、CAN、UART', 4),
  ('linux-embedded', '嵌入式 Linux', '设备树、驱动、内核', 5),
  ('algorithm', '算法与数据结构', '环形缓冲区、状态机、排序', 6),
  ('hardware', '硬件基础', '电路、示波器、逻辑分析仪', 7),
  ('interview-mixed', '面试综合', '跨方向综合题', 8);

-- Companies
insert into companies (slug, name, full_name, description, display_order) values
  ('huawei', '华为', '华为技术有限公司', '国内嵌入式岗位主要雇主之一', 1),
  ('dji', '大疆', '大疆创新科技有限公司', '无人机、机器人、嵌入式', 2),
  ('hikvision', '海康', '海康威视', '安防、摄像头、嵌入式', 3),
  ('byd', '比亚迪', '比亚迪股份有限公司', '新能源汽车、电子', 4),
  ('xiaomi', '小米', '小米科技', '智能硬件、IoT', 5);
