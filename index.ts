const puppeteer = require('puppeteer')
const fs = require('fs')
const url = 'https://leagueoflegends.fandom.com/wiki/List_of_champions'

const scrapeChampion = async (page:any, champion:any) => {
  await page.goto(champion.url, { timeout: 0 })

  const info = await page.evaluate(() => {
    const name: string  = document.querySelector(`.portable-infobox .pi-title span`).innerHTML
    const description: string  = document.querySelector(`.portable-infobox .pi-item div span`).innerHTML.charAt(0).toUpperCase() +
    document.querySelector(`.portable-infobox .pi-item div span`).innerHTML.slice(1);

    const scrapeSidebar = (dataSource: string): string[] | string =>{
      const items: string[] | string = []
      const parent: HTMLElement  = document.querySelector(`.portable-infobox .pi-item[data-source=${dataSource}] .pi-data-value`)
      const anchors: HTMLElement[] = Array.from(parent.querySelectorAll('a'))

      if (dataSource === "release"){
        return anchors[0].innerHTML.split('-')[0]
      }

      if (dataSource === "resource" ||dataSource === "rangetype" || dataSource === "adaptivetype" || dataSource === "cost"){
        return anchors[1].innerHTML
      }

      for (let i = 1 ; i < anchors.length ; i += 2){
        items.push(anchors[i].innerHTML)
      }
      return items
    }

    const release = scrapeSidebar("release")
    const classes = scrapeSidebar("legacy")
    const positions = scrapeSidebar("position")
    const resource = scrapeSidebar("resource")
    const rangeType = scrapeSidebar("rangetype")
    const dmgType = scrapeSidebar("adaptivetype")
    const price = scrapeSidebar("cost")
    
    return { name, description, release, classes, positions, resource, rangeType, dmgType, price }
  })
  await page.goBack()

  return info
}

const main = async () => {

  const start = Date.now()
  const browser = await puppeteer.launch({ headless: false, timeout: 0})
  const page = await browser.newPage();
  await page.goto(url, {timeout: 0})

  const champions = await page.evaluate(() => {

    const championsElements: HTMLElement[] = Array.from(document.querySelectorAll('tr td span span a'))
    const championsData: Object = championsElements.map((champ:any) => ({

      url: champ.href,

    }))
    
    return championsData
  })

  const scrapedData= []
  let counter = 0;
  for (const champion of champions) {
    const champ = await scrapeChampion(page, champion)
    const champWithId = { id: counter, ...champ };
    counter++;
    console.log(champWithId)
    scrapedData.push(champWithId)
  }

  await browser.close()
  
  const timeTaken = Math.floor(((Date.now() - start) / 1000) / 60)

  fs.writeFile('champs.json', JSON.stringify(scrapedData), (err:any) =>{
    if (err) throw err
    console.log(`JSON done in ${timeTaken} minutes.`)
  })
}

main()