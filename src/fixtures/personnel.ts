// ข้อมูลบุคลากรกองบริการหอพักนักศึกษา — จาก dorm.kku.ac.th (reference/data-packs/dorm_kku_ui_assets)
export interface PersonnelProfile {
  id: number
  section: string
  name: string
  position: string
  email?: string
  /** URL รูปใน public/personnel-images */
  photo: string
}

/** ลำดับกลุ่มตามหน้าเว็บจริง */
export const personnelSections: string[] = ["บุคลากรกองบริการหอพักนักศึกษา", "หัวหน้าหน่วยบริการหอพัก", "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", "ช่างหน่วยซ่อมบำรุงหอพัก"]

export const personnel: PersonnelProfile[] = [
  { id: 1, section: "บุคลากรกองบริการหอพักนักศึกษา", name: "เพ็ญนภา ชนะทัพ", position: "รักษาการแทนผู้อำนวยการกองบริการหอพักนักศึกษา", email: "cpenna@kku.ac.th", photo: "/personnel-images/01-pen-napha-chana-thap.jpg" },
  { id: 2, section: "บุคลากรกองบริการหอพักนักศึกษา", name: "ก้องฟ้า ขันธ์ชารี", position: "หัวหน้างานพัฒนาและบำรุงรักษาหอพัก", email: "kongkh@kku.ac.th", photo: "/personnel-images/02-kongfa-khancharee.jpg" },
  { id: 3, section: "บุคลากรกองบริการหอพักนักศึกษา", name: "พัชราภรณ์ ภัทรารักษ์", position: "หัวหน้างานบริหารหอพัก", email: "patcharpronph@kku.ac.th", photo: "/personnel-images/03-patcharaporn-phatrarak.jpg" },
  { id: 4, section: "หัวหน้าหน่วยบริการหอพัก", name: "วลีรัตน์ คำสีทา", position: "หัวหน้าหน่วยบริการหอพักที่ 1", email: "kitaratka@kku.ac.th", photo: "/personnel-images/07-waleerat-kamsitha.jpg" },
  { id: 5, section: "หัวหน้าหน่วยบริการหอพัก", name: "นภัสนันท์ สุดใด", position: "หัวหน้าหน่วยบริการหอพักที่ 2", email: "napapi@kku.ac.th", photo: "/personnel-images/08-napassanun-sudai.jpg" },
  { id: 6, section: "หัวหน้าหน่วยบริการหอพัก", name: "กรรณฏา ยศสุ", position: "หัวหน้าหน่วยบริการหอพักที่ 3", email: "swarar@kku.ac.th", photo: "/personnel-images/09-kannata-yotsu.jpg" },
  { id: 7, section: "หัวหน้าหน่วยบริการหอพัก", name: "พัชราภรณ์ ภัทรารักษ์", position: "หัวหน้าหน่วยบริการหอพักที่ 4", email: "patcharpronph@kku.ac.th", photo: "/personnel-images/03-patcharaporn-phatrarak.jpg" },
  { id: 8, section: "หัวหน้าหน่วยบริการหอพัก", name: "ก้องฟ้า ขันธ์ชารี", position: "หัวหน้าหน่วยบริการหอพักที่ 5", email: "kongkh@kku.ac.th", photo: "/personnel-images/02-kongfa-khancharee.jpg" },
  { id: 9, section: "หัวหน้าหน่วยบริการหอพัก", name: "นฤมล โฮมป่า", position: "หัวหน้าหน่วยบริการหอพักที่ 6", email: "naruho@kku.ac.th", photo: "/personnel-images/10-narumon-hompa.jpg" },
  { id: 10, section: "หัวหน้าหน่วยบริการหอพัก", name: "เจษฎาภรณ์ สมประสงค์", position: "หัวหน้าหน่วยอำนวยการ", email: "jedsaso@kku.ac.th", photo: "/personnel-images/11-jetsadaporn-somprasong.jpg" },
  { id: 11, section: "หัวหน้าหน่วยบริการหอพัก", name: "ทรงวุฒิ อดทน", position: "หัวหน้าหน่วยซ่อมบำรุง", email: "songod@kku.ac.th", photo: "/personnel-images/12-songwut-odthon.jpg" },
  { id: 12, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "กัญญาณัฏฐ์ ประดับคำ", position: "ธุรการประจำหน่วยอำนวยการ", email: "kanypad@kku.ac.th", photo: "/personnel-images/13-kanyanat-pradubkham.jpg" },
  { id: 13, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "อรุณี ศรีจำนงค์", position: "ธุรการหน่วยบริการหอพักที่ 2", email: "aruneesr@kku.ac.th", photo: "/personnel-images/14-arunee-srichamnong.jpg" },
  { id: 14, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "กนกศรี สุขวิเศษ", position: "ธุรการหน่วยบริการหอพักที่ 3", email: "kanoksuk@kku.ac.th", photo: "/personnel-images/15-kanoksri-sukwiset.jpg" },
  { id: 15, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "ญาณิฐา ลำเพ็ง", position: "ธุรการหน่วยบริการหอพักที่ 4", email: "chamermtla@kku.ac.th", photo: "/personnel-images/16-yanitha-lampheng.jpg" },
  { id: 16, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "ธนิดา พลศักดิ์", position: "ธุรการหน่วยบริการหอพักที่ 6", email: "tanidapo@kku.ac.th", photo: "/personnel-images/17-thanida-phonsak.jpg" },
  { id: 17, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "จันทิรา ไชยสิน", position: "เจ้าหน้าที่ประจำหน่วยหอพักที่ 1", email: "jantch@kku.ac.th", photo: "/personnel-images/18-chantira-chaiyasin.jpg" },
  { id: 18, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "ชาลี แก้วประดิษฐ์", position: "เจ้าหน้าที่ประจำหน่วยหอพักที่ 5", email: "chakae@kku.ac.th", photo: "/personnel-images/19-chalee-kaewpradit.jpg" },
  { id: 19, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "บัว โนนศรี", position: "เจ้าหน้าที่ประจำหน่วยหอพัก", email: "buanon@kku.ac.th", photo: "/personnel-images/20-bua-nonsri.jpg" },
  { id: 20, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "อาทิตย์ อุปฮาต", position: "เจ้าหน้าที่ประจำหน่วยหอพัก", email: "rathau@kku.ac.th", photo: "/personnel-images/21-athit-upahat.jpg" },
  { id: 21, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "อุไรพร อิ่มนาง", position: "เจ้าหน้าที่ประจำหน่วยหอพัก", email: "auraim@kku.ac.th", photo: "/personnel-images/22-uraiporn-imnang.jpg" },
  { id: 22, section: "ธุรการหน่วยหอพักและเจ้าหน้าที่หอพัก", name: "พัชรินทร์ แสนนา", position: "เจ้าหน้าที่ประจำหน่วยอำนวยการ", email: "patcsa@kku.ac.th", photo: "/personnel-images/23-patcharin-saenna.jpg" },
  { id: 23, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "ปาคม ครุฑชัย", position: "ช่างไฟฟ้า", email: "pakokr@kku.ac.th", photo: "/personnel-images/25-pakom-krutchai.jpg" },
  { id: 24, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "ศุภการย์ คลังบุญครอง", position: "ช่างไฟฟ้า", email: "supakl@kku.ac.th", photo: "/personnel-images/26-supakan-klangboonkrong.jpg" },
  { id: 25, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "จิตรติทร คุณธะรักษ์", position: "ช่างไฟฟ้า", email: "jittku@kku.ac.th", photo: "/personnel-images/27-jittitorn-khuntharak.jpg" },
  { id: 26, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "ปรีชา จุลมา", position: "ช่างไฟฟ้า", email: "peecju@kku.ac.th", photo: "/personnel-images/28-preecha-junma.jpg" },
  { id: 27, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "วิทวัส โกกอุ่น", position: "ช่างไม้ – ช่างปูน", email: "withgo@kku.ac.th", photo: "/personnel-images/29-withawat-kokoon.jpg" },
  { id: 28, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "สกล กันหา", position: "ช่างไม้ – ช่างปูน", email: "sakogu@kku.ac.th", photo: "/personnel-images/30-sakon-kanha.jpg" },
  { id: 29, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "ณัฐวุฒิ อิ่มนาง", position: "ช่างไม้ – ช่างปูน", email: "..@kku.ac.th", photo: "/personnel-images/31-nattawut-imnang.jpg" },
  { id: 30, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "นัฐพล มาโสภา", position: "ช่างไม้ – ช่างปูน", email: "natthma@kku.ac.th", photo: "/personnel-images/32-natthapol-masopha.jpg" },
  { id: 31, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "อรรถพล ชนะการี", position: "ช่างประปา", email: "attapch@kku.ac.th", photo: "/personnel-images/33-attapol-chanakaree.jpg" },
  { id: 32, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "ธรรมนูญ เนื่องอาชา", position: "ช่างประปา", email: "thamnu@kku.ac.th", photo: "/personnel-images/34-thamnu-nueangacha.jpg" },
  { id: 33, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "โสภา เดชแพง", position: "ช่างประปา", email: "sopade@kku.ac.th", photo: "/personnel-images/35-sopha-dechphaeng.jpg" },
  { id: 34, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "วิมล ทันเขิม", position: "ช่างประปา", email: "wimoth@kku.ac.th", photo: "/personnel-images/36-wimon-thankheum.jpg" },
  { id: 35, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "นายกฤษฎา แสนนา", position: "ช่างประปา", email: "kitsan@kku.ac.th", photo: "/personnel-images/37-kritsada-saenna.jpg" },
  { id: 36, section: "ช่างหน่วยซ่อมบำรุงหอพัก", name: "อรุณ เพียหอชัย", position: "เจ้าหน้าที่ประจำหน่วย", email: "aroopr@kku.ac.th", photo: "/personnel-images/38-arun-piahorchai.jpg" },
]

export const dormOfficeContact = {"organization": "กองบริการหอพักนักศึกษา (หอพักส่วนกลาง)", "address": "123 หมู่ 16 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมือง จังหวัดขอนแก่น 40002", "officeHours": "วันจันทร์ – วันศุกร์ เวลา 08.30 – 16.30 น. ในวันและเวลาราชการ"}
