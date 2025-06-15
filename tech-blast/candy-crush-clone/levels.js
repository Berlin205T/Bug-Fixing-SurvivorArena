class Level {
  constructor(level, movesAllowed, candiesRequired) {
    this.level = level
    this.movesAllowed = movesAllowed;
    this.candiesRequired = candiesRequired;
  }
}

const level1 = new Level(1, 15,
   ['puppy', 18]
)

const level2 = new Level(2, 20, 
   ['cow', 20]
)

const level3 = new Level(3, 23, 
  ['pig', 30]
)

const level4 = new Level(4, 25, 
  ['bear', 33]
)

const level5 = new Level(5, 30, 
  ['bee', 35]
)
const level6 = new Level(6, 35, 
  ['pig', 39]
)

const level7 = new Level(7, 40, 
  ['puppy', 43]
)

const level8 = new Level(8, 45, 
  ['cow', 48]
)

const level9 = new Level(9, 50, 
    ['bear', 53]
  )

  const level10 = new Level(10, 55, 
    ['cow', 58]
  )

  const level11 = new Level(11, 60, 
    ['bee', 63]
  )

  const level12 = new Level(12, 65, 
    ['pig', 65]
  )

  const level13 = new Level(13, 67, 
    ['cow', 70]
  )
const levels = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9,
  level10,
  level11,
  level12,
  level3
]

// console.log(levels)