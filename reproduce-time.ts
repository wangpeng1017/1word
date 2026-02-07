
const now = new Date()
const totalTime = 916

console.log('System Date:', new Date().toString())
console.log('now:', now)
console.log('now.toISOString():', now.toISOString())
console.log('now.getTime():', now.getTime())

const startedAt = new Date(now.getTime() - totalTime * 1000)
console.log('startedAt:', startedAt)
console.log('startedAt.toISOString():', startedAt.toISOString())

// Check if timezone offset is involved
console.log('Timezone Offset:', now.getTimezoneOffset())
