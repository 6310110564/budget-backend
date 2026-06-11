type CategorySeed = {
  name: string
  icon: string
}


// mock data for default categories when user registers
export const defaultIncomes: CategorySeed[] = [
  { name: 'เงินเดือน', icon: '💼' },
  { name: 'โบนัส', icon: '🎁' },
  { name: 'Freelance', icon: '💻' },
  { name: 'ลงทุน', icon: '📈' },
  { name: 'อื่นๆ', icon: '💰' }
]

export const defaultExpenses: CategorySeed[] = [
  { name: 'อาหาร', icon: '🍜' },
  { name: 'เดินทาง', icon: '🚗' },
  { name: 'ที่พัก', icon: '🏠' },
  { name: 'สุขภาพ', icon: '💊' },
  { name: 'บันเทิง', icon: '🎮' },
  { name: 'ช้อปปิ้ง', icon: '🛍️' },
  { name: 'ออม', icon: '🏦' },
  { name: 'อื่นๆ', icon: '📦' }
]