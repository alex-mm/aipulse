/**
 * 武侠风随机昵称生成器
 * 首次访问生成，存入 localStorage 持久化复用
 */

const STORAGE_KEY = 'aipulse_wuxia_nick'

// 姓氏库 — 取自金庸/古龙经典角色 + 武侠常见复姓
const SURNAMES = [
  // 单姓
  '杨', '张', '郭', '黄', '萧', '段', '林', '周', '赵', '谢',
  '风', '云', '白', '江', '柳', '叶', '花', '楚', '陆', '凌',
  '沈', '苏', '韩', '唐', '方', '石', '秦', '穆', '程', '袁',
  '霍', '殷', '乔', '任', '温', '梅', '燕', '龙', '狄', '卓',
  // 复姓
  '令狐', '独孤', '东方', '西门', '南宫', '上官',
  '慕容', '欧阳', '公孙', '司马', '诸葛', '皇甫',
  '轩辕', '端木', '百里', '夏侯',
]

// 名字库 — 取自经典角色名 + 武侠意象词
const GIVEN_NAMES = [
  // 经典角色名
  '无忌', '芷若', '盈盈', '不群', '翠山', '素素',
  '留香', '小凤', '飞雪', '含光', '逍遥', '惊鸿',
  '如风', '听雨', '凌云', '踏雪', '寻梅', '临风',
  '孤鸿', '天涯', '沧海', '烟雨', '落霞', '长风',
  // 单字
  '剑', '影', '尘', '岚', '澈', '墨', '弦', '鹤', '隐', '遥',
  // 武侠意象
  '望月', '惊蛰', '破晓', '问道', '乘风', '揽星',
  '照雪', '悬壶', '栖云', '拾光', '归尘', '倚楼',
  '渡川', '碎星', '掠影', '斩浪', '扶摇', '横笛',
  '泠泉', '疏桐', '鸣镝', '霜刃', '啸天', '御风',
]

// 称号前缀 — 增加趣味性（20% 概率触发）
const TITLES = [
  '大侠', '少侠', '剑客', '刀客', '隐士', '散人',
  '居士', '道人', '浪子', '游侠', '侠客', '行者',
]

/**
 * 基于随机种子生成一个武侠名字
 * 算法：随机姓 + 随机名，20% 概率加称号后缀
 */
function generate(): string {
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
  const givenName = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)]
  const name = surname + givenName

  // 20% 概率加称号
  if (Math.random() < 0.2) {
    const title = TITLES[Math.floor(Math.random() * TITLES.length)]
    return `${name} · ${title}`
  }

  return name
}

/**
 * 获取当前用户的武侠昵称
 * - 首次访问：生成并存储
 * - 后续访问：从 localStorage 读取
 */
export function getWuxiaNick(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
  } catch {
    // localStorage 不可用（隐私模式等）
  }

  const name = generate()

  try {
    localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // ignore
  }

  return name
}

/**
 * 更新用户昵称（用户手动修改时调用）
 */
export function setWuxiaNick(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // ignore
  }
}
