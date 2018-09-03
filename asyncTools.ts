import * as Async from 'awaity'

const iterate = iterator => async (...items) =>
  new Promise((resolve, reject) =>
    setImmediate(() => {
      try {
        const result = iterator(...items)
        return resolve(result)
      } catch (err) {
        return reject(err)
      }
    })
  )

export const createArray = async (size, value?) => {
  const result = []
  return new Promise((resolve, reject) => {
    try {
      const pushInArray = n => {
        if (n === size) {
          return resolve(result)
        }
        result.push(value)
        // return setTimeout(() => pushInArray(n + 1), 0)
        return setImmediate(() => pushInArray(n + 1))
      }

      return pushInArray(0)
    } catch (err) {
      return reject(err)
    }
  })
}

export const filter = async (items, iterator, limit) => {
  return Async.filterLimit(items, iterate(iterator), limit)
}

export const map = async (items, iterator, limit) => {
  return Async.mapLimit(items, iterate(iterator), limit)
}

export const range = async (from, to) => {
  const initialArray = await createArray(to - from, 0)
  // console.log(initialArray)
  return map(initialArray, (_, i) => i + from, 1)
  // return map([...Array(to - from)], (_, i) => i + from, 1)
}
