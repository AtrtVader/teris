// доступ к холсту
const canvas = document.getElementById('game')
const context = canvas.getContext('2d')
// размер квадратика
const grid = 32
// массив с последовательностью фигур, на статре - пустой
let tetrominoSequence = []
// с помощью двумерного массива следим за тем, что находится в каждой клетке игрового поля
// размер поля  - 1 на 20, и несколько строк еще находится за видимой областью
let playfield = []

// заполняем массив пустыми ячейками
for (let row = -2; row < 20; row++) {
  playfield[row] = []

  for (let col = 0; col < 10; col++) {
    playfield[row][col] = 0
  }
}

// задаем формы для каждой фигуры

const tetrominos = {
  'I': [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  'J': [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'L': [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  'O': [
    [1, 1],
    [1, 1]
  ],
  'S': [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  'Z': [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  'T': [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ]
}

// цвет каждой фигуры
const colors = {
  'I': 'cyan',
  'O': 'yellow',
  'T': 'purple',
  'S': 'green',
  'Z': 'red',
  'J': 'blue',
  'L': 'orange'
}

// счетчик
let count = 0
// теукущая фигура в игре
let tetromino = getNextTetromino()
// следим за кадрами анимации, что бы если что - остановить игру
let rAF = null
// флаг конца игры, на старте - неактивный
let gameOver = false




// функция возвращает случайное число в заданном диапазоне
function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)

  return Math.floor(Math.random() * (max - min + 1)) + min
}

// создаем последовательность фигур которая появится в игре
function generateSequence() {
  // сами фигуры
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']

  while (sequence.length) {
    // случайным образом находим любую из них
    const rand = getRandomInt(0, sequence.length - 1)
    const name = sequence.splice(rand, 1)[0]
    // помещаем выбранную фигуру в игровой массив с последовательностями
    tetrominoSequence.push(name)
  }
}

// получаем следующую фигуру
function getNextTetromino() {
  // если следующей нет - генерируем
  if (tetrominoSequence.length === 0) {
    generateSequence()
  }
  // берем первую фигуру из массива
  const name = tetrominoSequence.pop()
  // создаем матрицу, с которой мы отрисуем фигуру
  const matrix = tetrominos[name]

  // I и O стартуют с середины, остальные - чуть левее
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2)

  // I начинает с 21 строки (смещение -1), а все остальные - со строки 22 (смещение -2)
  const row = name === 'I' ? -1 : -2

  return {
    name :     name,     // название фигуры
    matrix:    matrix,   // матрица с фигурой
    row :      row,      // текущая строка (фигуры стартуют за видимой областью холста)
    col :      col       // текущий столбец
  }
}

// поворачиваем матрицу на 90 градусов
// https://codereview.stackexchange.com/a/186834
function rotate(matrix) {
  const N = matrix.length - 1
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  )
  // на входе матрица, и на выходе тоже отдает матрицу
  return result
}

// проверяем после появления или вращения, может ли матрица (фигура) быть в этом месте поля или она вылезет за его границы
function isValidMove(matrix, cellRow, cellCol) {
  // проверяем все строки и столбцы
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] && (
        // если выходит за границы поля...
        cellCol + col < 0 ||
        cellCol + col >= playfield[0].length ||
        cellRow + row >= playfield.length ||
        // ...или пересекается с другими фигурами
        playfield[cellRow + row][cellCol + col])
      ) {
        return false
      }
    }
  }
  // если прошли все проверки - все в порядке
  return true
}

// когда фигура окончательно встала на свое место
function placeTetromino() {
  // обрабатываем все строки и столбцы в игровом поле
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        // если карй фигуры после установки вылезает за границы поля, то игра заканчивается
        if (tetromino.row + row < 0) {
          return showGameOver()
        }
        // если все в порядке, то записываем в массив игрового поля нашу фигуру
        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name
      }
    }
  }

  // проверяем, что бы заполненные ряды очистились снизу вверх
  for (let row = playfield.length - 1; row >= 0;) {
    // если ряд заполнен
    if  (playfield[row].every(cell => !!cell)) {
      score += 10
      // считаем уровень
      level = Math.floor(score/100) + 1
      // если игрок побил прошлый рекорд
      if (score > record) {
        // ставим его очки как рекорд
        record = score
        // заносим в хранилище
        localStorage.record = record
        // меняем имя чемпиона
        recordName = name
        localStorage.recordName = name
      }

      // очищаем его и опускаем все вниз на одну клетку
      for (let r = row; r >= 0; r--) {
        for (let c = 0;c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r-1][c]
        }
      }
    }
    else {
      // переходим к следующему ряду
      row--
    }
  }
  // получаем слудующую фигуру
  tetromino = getNextTetromino()
}

// показываем напись Game Over
function showGameOver() {
  // прекращаем всю анимацию игры
  cancelAnimationFrame(rAF)
  // ставим флаг окончания
  gameOver = true
  // рисуем черный прямоугольник посередине поля
  context.fillStyle = 'black'
  context.globalAlpha = 0.75
  context.fillRect(0, canvas.height / 2 -30, canvas.width, 60)
  // пишем надпись белым моноширинным шрифтом по центру
  context. globalAlpha = 1
  context.fillStyle = 'white'
  context.font = '36px monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2)
}

// следим за нажатиями на клавиши
document.addEventListener('keydown', function (e) {
  // если игра закончилась сразу выходим
  if (gameOver) return

  // стрелки влево и вправо
  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37
    // если влево то уменьшаем индекс в столбце, если вправо - увеличиваем
    ? tetromino.col - 1
    : tetromino.col + 1

    // если так ходить можно, то запоминаем текущее положение
    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col
    }
  }

  // стрелка вверх - поворот
  if (e.which === 38) {
    // поворачиваем фигуру на 90 градусов
    const matrix = rotate(tetromino.matrix)
    // если можно ходить запоминаем
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix
    }
  }

  // стрелка вниз - ускорить падение
  if (e.which === 40) {
    // смещаем фигуру на строку вниз
    const row = tetromino.row + 1
    // если опускаться некуда - запоминаем новое положение
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1
      // ставим на место и смотрим на заполненные ряды
      placeTetromino()
      return
    }
    // запоминаем строку, куда встала фигура
    tetromino.row = row
  }
})

function showScore() {
  contextScore.clearRect(0, 0, canvasScore.width, canvasScore.height)
  contextScore.globalAlpha = 1
  contextScore.fillStyle = 'white'
  contextScore.font = '18px Courier New'
  contextScore.fillText('Уровень: ' + level, 15, 20)
  contextScore.fillText('Очков: ' + score, 15, 50)
  contextScore.fillText('Чемпион: ' + recordName, 160, 20)
  contextScore.fillText('Рекорд: ' + record, 160, 50)
}

// главный цикл игры
function loop() {
  // показываем блок с очками
  showScore()
  // начинаем анимацию
  rAF = requestAnimationFrame(loop)
  // очищаем холст
  context.clearRect(0, 0, canvas.width, canvas.height)

  // рисуем игровое поле с учетом заполненных фигур
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col]
        context.fillStyle = colors[name]

        // рисуем все на один пиксель меньше, что бы получился эффект "в клетку"
        context.fillRect(col * grid, row * grid, grid-1, grid-1)
      }
    }
  }
  // рисуем текущую фигуру
  if (tetromino) {

    // фигура сдвигается вниз каждые 35 кадров
    if  (++count > (36 - level)) {
      tetromino.row++
      count = 0

      // если движенние закончилось - рисуем фигуру в поле и проверяем, можно ли удалить строки
      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--
        placeTetromino()
      }
    }

    // цвет текущей фигуры
    context.fillStyle = colors[tetromino.name]

    // отрисовываем ее
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {

          // снова рисуем на один пиксель меньше
          context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1)
        }
      }
    }
  }
}

// страт игры
rAF = requestAnimationFrame(loop)


// получаем доступ к холсту с игровой статистикой
const canvasScore = document.getElementById('score')
const contextScore = canvasScore.getContext('2d')

// количество набранных очков на старте
let score = 0
// рекорд
let record = 0
// текущий уровень сложности
let level = 1
// имя игрока с наибольшим рейтингом
let recordName = ''
//Имя игрока
let name = prompt('Ваше имя', '')


// узнаем размер хранилища
let Storage_size = localStorage.length
// если в хранилище уже что то есть...
if (Storage_size > 0) {
  // ...то достаем оттуда значение рекорда и имя чепиона
  record = localStorage.record
  recordName = localStorage.recordName
}