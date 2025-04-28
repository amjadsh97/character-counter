import {useDeferredValue, useMemo, useState} from "react";
import {syllable} from "syllable";
import './App.css'

type UserInfo = {
  text: string,
  isSpacesExcluded: boolean,
  hasCharLimit: boolean
}

function App() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    text: "",
    isSpacesExcluded: false,
    hasCharLimit: false
  })
  const [charLimit, setCharLimit] = useState<undefined | number>(undefined)
  const [error, setError] = useState<string>("")
  const [isLight, setIsLight] = useState(false)
  const [showMoreItems, setShowMoreItems] = useState(false)
  const {text, isSpacesExcluded, hasCharLimit} = userInfo;
  const deferredText = useDeferredValue(text);
  // const deferredText = text;

  const {totalCharacter, wordCounts, sentenceCounts, listOfDensity, readingMinutes} = useMemo(() => {
    const source = deferredText;           // <— heavy work uses deferred value

    const totalCharacter = isSpacesExcluded
      ? source.replace(/\s/g, "").length
      : source.length;

    const words = source.trim().split(/\s+/).filter(Boolean);
    const wordCounts = source.trim().split(/\s+/).filter(Boolean).length;
    const sentenceCounts = source.split(/[.!?]+/).filter(Boolean).length;

    const freq: Record<string, number> = {};
    for (const ch of source.replace(/\s/g, "")) {
      freq[ch] = (freq[ch] || 0) + 1;
    }

    const listOfDensity = Object.entries(freq)
      .map(([k, v]) => [k, v, Math.round((v / (totalCharacter || 1)) * 100)] as [
        string,
        number,
        number
      ])
      .sort((a, b) => b[1] - a[1]);

    const syllableCount = words.reduce((sum, w) => sum + syllable(w), 0);
    const readingMinutesRaw = syllableCount / 180;    // ~180 syllables per minute
    const readingMinutes = readingMinutesRaw < 1 ? "< 1" : Math.round(readingMinutesRaw);

    return {totalCharacter, wordCounts, sentenceCounts, listOfDensity, readingMinutes};
  }, [deferredText, isSpacesExcluded]);

  const handleCharLimit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      setCharLimit(undefined);
      return;
    }
    if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
      setCharLimit(+inputValue);
    }
  }


  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;

    // remove spaces
    const newCharacterCount = isSpacesExcluded
      ? newText.split(' ').join('').length
      : newText.length;

    if (hasCharLimit) {
      if (newCharacterCount <= Number(charLimit)) {
        setUserInfo({...userInfo, text: newText});
        setError("");
      } else {
        setError("Limit reached! Your text exceeds " + charLimit + " characters.");
        setUserInfo({...userInfo, text: newText});
      }
    } else {
      setUserInfo({...userInfo, text: newText});
      setError("");
    }
  };

  return (
    <div className='main'>
      <div className={`app-wrapper ${isLight ? "light" : "dark"}`}>
        <div className="app-inner">
          <main>
            <header className='header'>
              <div className="image-wrapper">
                {isLight ? <img src="/images/logo-light-theme.svg" alt="logo"/> :
                  <img src="/images/logo-dark-theme.svg" alt="logo"/>}
              </div>
              <button className='theme-button' onClick={() => setIsLight(prev => !prev)}>
                {isLight ? <img src="/images/icon-moon.svg" alt="theme image"/> :
                  <img src="/images/icon-sun.svg" alt="theme image"/>
                }
              </button>
            </header>
            <h1 className='title text-preset-1'>Analyze your text in real-time.</h1>
            <div className={`textarea-element ${error ? "error" : ""}`}>
              <label htmlFor="text"></label>
              <textarea placeholder={"Start typing here… (or paste your text)"} className={`text-preset-3 `}
                        onChange={handleTextChange} value={userInfo.text}
                        name="text"
                        id="text" cols={30} rows={10}></textarea>
            </div>

            {error && <p className='error text-preset-4'>{error}</p>}
            <div className="filters">
              <label htmlFor="spaces">
                <input checked={userInfo.isSpacesExcluded}
                       onChange={e => setUserInfo({...userInfo, isSpacesExcluded: e.target.checked})}
                       type="checkbox" name="spaces" id="spaces"/>
                <span>Exclude Spaces</span>
              </label>
              <label htmlFor="limit">
                <input checked={userInfo.hasCharLimit}
                       onChange={e => setUserInfo({...userInfo, hasCharLimit: e.target.checked})}
                       type="checkbox"
                       name="limit"
                       id="limit"/>
                <span>Set Character Limit</span>
              </label>
              {userInfo.hasCharLimit && <input type="text" className={'char-limit text-preset-4'} value={charLimit}
							                                 onChange={handleCharLimit}/>}
              <p className='reading-time'>Approx. reading
                time: {readingMinutes} minute{readingMinutes !== "< 1" && "s"}</p>
            </div>

            <div className="cards-wrapper">
              <div className="card">
                <span className='card__value text-preset-1'>{totalCharacter}</span>
                <span className={'card__desc text-preset-3'}>Total Characters</span>
              </div>
              <div className="card">
                <span className='card__value text-preset-1'>{wordCounts}</span>
                <span className={'card__desc text-preset-3'}>Word Count</span>
              </div>
              <div className="card">
                <span className='card__value text-preset-1'>{sentenceCounts}</span>
                <span className={'card__desc text-preset-3'}>Sentence Count</span>
              </div>
            </div>

            <div className='letter-density'>
              <h2 className='text-preset-2 letter-density__title'>Letter Density</h2>
              {listOfDensity.length === 0 &&
								<p className='text-preset-4'>No characters found. Start typing to see letter density.</p>}
              {listOfDensity.length > 0 && <ul className='density-list'>
								<>
                  {(showMoreItems ? listOfDensity.slice(0, 5) : listOfDensity).map(item => (

                    <li className='density-list__item text-preset-4'>
                      <span className='letter'>{item[0]}</span>
                      <span style={{"--width": `${item[2]}%`} as React.CSSProperties} className='meter'></span>
                      <div className="item-wrapper">
                        <span className='count-char'>{item[1]}</span>
                        <span className='percentage-char'>({item[2]}%)</span>
                      </div>
                    </li>
                  ))}
									<button className='show-more-content text-preset-3' onClick={() => setShowMoreItems(prev => !prev)}>
										<span>{showMoreItems ? "See more" : "See less"}</span>
										<img className={`${showMoreItems ? "" : "reverse"}`} src="/images/arrow-light.png" alt=""/>
									</button>
								</>
							</ul>}
            </div>
          </main>

        </div>
      </div>
      <footer></footer>
    </div>
  )
}

export default App
