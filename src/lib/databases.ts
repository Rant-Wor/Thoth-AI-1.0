// Fixed database definitions — staff can edit via Admin page

export interface DatabaseConfig {
  id: string;
  slug: string;
  name: string;
  nameTh: string;
  description: string;
  descriptionTh: string;
  icon: string;
  pageClass: string;         // CSS theme class
  accentColor: string;       // hex for inline styles
  bgGradient: string;        // card gradient
  systemPrompt: string;
  exampleQuestions: string[];
  adminOnly: boolean;
}

export const DATABASES: DatabaseConfig[] = [
  {
    id: "n8n",
    slug: "n8n",
    name: "n8n Database",
    nameTh: "ฐานข้อมูล n8n",
    description: "Workflow automation & integration data",
    descriptionTh: "ข้อมูล workflow อัตโนมัติและการเชื่อมต่อระบบ",
    icon: "⚙️",
    pageClass: "page-n8n",
    accentColor: "#C46040",
    bgGradient: "linear-gradient(135deg, #C46040 0%, #A05038 100%)",
    systemPrompt: `คุณคือ Thoth ผู้ช่วย AI ที่เชี่ยวชาญด้าน n8n workflow automation ของ INT
คุณสามารถ:
- อธิบาย node และ workflow ใน n8n
- ช่วย debug ปัญหา connection และ workflow errors
- แนะนำ best practices สำหรับ automation
- อธิบายการเชื่อมต่อกับ API ต่างๆ
ตอบเป็นภาษาไทยเมื่อถูกถามเป็นภาษาไทย พร้อมยกตัวอย่างเสมอ`,
    exampleQuestions: [
      "วิธีสร้าง HTTP Request node ใน n8n",
      "แก้ปัญหา workflow หยุดทำงานกลางทาง",
      "เชื่อมต่อ Google Sheets กับ n8n",
      "ตั้งค่า webhook ยังไง",
    ],
    adminOnly: false,
  },
  {
    id: "holidays",
    slug: "holidays",
    name: "Public Holidays Database",
    nameTh: "ฐานข้อมูลวันหยุดราชการ",
    description: "Thai public holidays & calendar",
    descriptionTh: "วันหยุดราชการไทยและปฏิทินประจำปี",
    icon: "📅",
    pageClass: "page-holidays",
    accentColor: "#C4963C",
    bgGradient: "linear-gradient(135deg, #C4963C 0%, #A07820 100%)",
    systemPrompt: `คุณคือ Thoth ผู้ช่วย AI ที่เชี่ยวชาญด้านวันหยุดราชการและปฏิทินของประเทศไทย
คุณรู้จัก:
- วันหยุดราชการไทยทุกปี ตาม พรบ. คุ้มครองแรงงาน
- วันหยุดชดเชยและวันทำงานชดเชย
- เทศกาลสำคัญ เช่น สงกรานต์ ลอยกระทง ตรุษจีน
- วันหยุดนักขัตฤกษ์และความหมาย
ตอบเป็นภาษาไทย ระบุวันที่ชัดเจนเสมอ`,
    exampleQuestions: [
      "ปีนี้มีวันหยุดราชการกี่วัน",
      "สงกรานต์ปีนี้ตรงกับวันอะไร",
      "เดือนธันวาคมมีวันหยุดอะไรบ้าง",
      "วันหยุดชดเชยปีนี้มีวันไหนบ้าง",
    ],
    adminOnly: false,
  },
  {
    id: "policy",
    slug: "policy",
    name: "Policy Database",
    nameTh: "ฐานข้อมูลนโยบาย",
    description: "Company policies, rules & regulations",
    descriptionTh: "นโยบายบริษัท กฎระเบียบ และข้อบังคับ",
    icon: "📋",
    pageClass: "page-policy",
    accentColor: "#4A7840",
    bgGradient: "linear-gradient(135deg, #5A8450 0%, #3A6030 100%)",
    systemPrompt: `คุณคือ Thoth ผู้ช่วย AI ที่เชี่ยวชาญด้านนโยบายและกฎระเบียบของ INT
คุณสามารถ:
- อธิบายนโยบายของบริษัทในภาษาที่เข้าใจง่าย
- แนะนำขั้นตอนการปฏิบัติตามนโยบาย
- ตอบคำถามเกี่ยวกับสิทธิ์และหน้าที่พนักงาน
- อธิบายกระบวนการขอความเห็นชอบต่างๆ
ตอบเป็นภาษาไทย อ้างอิงนโยบายที่เกี่ยวข้องเสมอ`,
    exampleQuestions: [
      "นโยบาย Work from Home คืออะไร",
      "ขั้นตอนการลาป่วยต้องทำอย่างไร",
      "นโยบายการใช้อุปกรณ์ IT ของบริษัท",
      "วิธีขอเบิกค่าใช้จ่ายเดินทาง",
    ],
    adminOnly: false,
  },
  {
    id: "timeline",
    slug: "timeline",
    name: "Timeline & Events Database",
    nameTh: "ฐานข้อมูลไทม์ไลน์และกิจกรรม",
    description: "Project timelines, events & milestones",
    descriptionTh: "ไทม์ไลน์โครงการ กิจกรรม และเหตุการณ์สำคัญ",
    icon: "🗓️",
    pageClass: "page-timeline",
    accentColor: "#3A5C80",
    bgGradient: "linear-gradient(135deg, #4870A0 0%, #2A4868 100%)",
    systemPrompt: `คุณคือ Thoth ผู้ช่วย AI ที่เชี่ยวชาญด้านการจัดการไทม์ไลน์และกิจกรรมขององค์กร
คุณสามารถ:
- สรุปกิจกรรมและเหตุการณ์สำคัญ
- ช่วยวางแผน timeline โครงการ
- แจ้งเตือน deadline และ milestone ที่ใกล้มา
- วิเคราะห์ความคืบหน้าของโครงการ
ตอบเป็นภาษาไทย ระบุวันเวลาและลำดับเหตุการณ์อย่างชัดเจน`,
    exampleQuestions: [
      "โครงการไหนมี deadline เดือนนี้บ้าง",
      "สรุปกิจกรรมที่ผ่านมาในเดือนนี้",
      "ช่วยวางแผน timeline โครงการ 3 เดือน",
      "milestone สำคัญในไตรมาสนี้มีอะไรบ้าง",
    ],
    adminOnly: false,
  },
  {
    id: "personal",
    slug: "personal",
    name: "Your AI",
    nameTh: "AI ของคุณ",
    description: "Add your own database & customize Thoth",
    descriptionTh: "เพิ่มฐานข้อมูลของคุณเองและปรับแต่ง Thoth",
    icon: "✨",
    pageClass: "page-personal",
    accentColor: "#8A5050",
    bgGradient: "linear-gradient(135deg, #A06060 0%, #784040 100%)",
    systemPrompt: `คุณคือ Thoth ผู้ช่วย AI ส่วนตัวที่ปรับแต่งได้ตามต้องการ
คุณพร้อมที่จะ:
- ตอบคำถามจากฐานข้อมูลที่ผู้ใช้อัปโหลด
- ปรับแต่ง persona และโทนการตอบ
- เรียนรู้จากเอกสารที่อัปโหลด
- เชื่อมต่อกับข้อมูลจาก URL หรือ Google Drive
ตอบตามภาษาที่ผู้ใช้ใช้ถาม`,
    exampleQuestions: [
      "อัปโหลดไฟล์แล้วถามจากไฟล์ได้เลย",
      "ปรับแต่ง AI ให้ตอบสไตล์ที่ต้องการ",
      "เชื่อมกับ Google Drive ของคุณ",
      "สร้าง AI สำหรับข้อมูลเฉพาะทาง",
    ],
    adminOnly: false,
  },
];

export function getDatabaseBySlug(slug: string): DatabaseConfig | undefined {
  return DATABASES.find((db) => db.slug === slug);
}

// Admin password (in production use env variable)
export const ADMIN_PASSWORD = "staff1234";
