import * as React from 'react'
import {json, Link, useLoaderData, useMatches} from 'remix'
import type {LoaderFunction} from 'remix'
import {Outlet} from 'react-router-dom'
import {AnimatePresence, motion} from 'framer-motion'
import clsx from 'clsx'
import type {Await, CallKentEpisode, KCDHandle} from 'types'
import {getEpisodes} from '../utils/transistor.server'
import {CallKentEpisodesProvider, useTeam} from '../utils/providers'
import {HeroSection} from '../components/sections/hero-section'
import {alexProfiles} from '../images'
import {ButtonLink} from '../components/button'
import {Grid} from '../components/grid'
import {getBlogRecommendations} from '../utils/blog.server'
import {BlogSection} from '../components/sections/blog-section'
import {H6, Paragraph} from '../components/typography'
import {ChevronUpIcon} from '../components/icons/chevron-up-icon'
import {ChevronDownIcon} from '../components/icons/chevron-down-icon'
import {HeaderSection} from '../components/sections/header-section'
import {TriangleIcon} from '../components/icons/triangle-icon'
import {formatTime} from '../utils/misc'
import {
  getEpisodeFromParams,
  getEpisodePath,
  Params as CallPlayerParams,
} from '../utils/call-kent'

type LoaderData = {
  episodes: Await<ReturnType<typeof getEpisodes>>
  blogRecommendations: Await<ReturnType<typeof getBlogRecommendations>>
}

export const loader: LoaderFunction = async ({request}) => {
  const [blogRecommendations, episodes] = await Promise.all([
    getBlogRecommendations(request),
    getEpisodes({request}),
  ])

  return json({
    blogRecommendations,
    episodes,
  })
}

export default function CallHomeScreen() {
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')

  const data = useLoaderData<LoaderData>()
  const [team] = useTeam()
  const avatar = alexProfiles[team]

  const sortedEpisodes =
    sortOrder === 'desc' ? data.episodes : [...data.episodes].reverse()

  const matches = useMatches()
  const callPlayerMatch = matches.find(
    match => (match.handle as KCDHandle | undefined)?.id === 'call-player',
  )
  let selectedEpisode: CallKentEpisode | undefined
  if (callPlayerMatch) {
    const callPlayerParams = callPlayerMatch.params as CallPlayerParams
    selectedEpisode = getEpisodeFromParams(sortedEpisodes, callPlayerParams)
  }
  const initialSelectedEpisode = React.useRef(selectedEpisode)

  // An effect to scroll to the episode's position when opening a direct link,
  // use a ref so that it doesn't hijack scroll when the user is browsing episodes
  React.useEffect(() => {
    if (!initialSelectedEpisode.current) return
    const href = getEpisodePath(initialSelectedEpisode.current)
    document.querySelector(`[href="${href}"]`)?.scrollIntoView()
  }, [])

  // used to automatically prefix numbers with the correct amount of zeros
  let numberLength = sortedEpisodes.length.toString().length
  if (numberLength < 2) numberLength = 2

  return (
    <>
      <HeroSection
        title="Calls with Kent C. Dodds."
        subtitle="You call, I'll answer."
        imageProps={avatar}
        arrowUrl="#episodes"
        arrowLabel="Wanna see my call logs?"
        action={
          <ButtonLink variant="primary" to="./record">
            Record your call
          </ButtonLink>
        }
      />

      <HeaderSection
        className="mb-16"
        title="This thing is a bit new."
        subTitle="But here is what we got."
      />

      {/*
        IDEA: when there will be many episodes, we could split this by year, and
        display it with tabs like on the podcast page. [2023, 2022, 2021]
      */}
      <Grid as="main" className="mb-24 lg:mb-64">
        <div className="flex flex-col col-span-full mb-6 lg:flex-row lg:justify-between lg:mb-12">
          <H6
            id="episodes"
            as="h2"
            className="flex flex-col col-span-full mb-10 lg:flex-row lg:mb-0"
          >
            <span>Calls with Kent C. Dodds</span>
            &nbsp;
            <span>{` — ${data.episodes.length} episodes`}</span>
          </H6>

          <button
            className="group text-primary relative text-lg font-medium focus:outline-none"
            onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
          >
            <div className="bg-secondary absolute -bottom-2 -left-4 -right-4 -top-2 rounded-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition" />
            <span className="relative inline-flex items-center">
              {sortOrder === 'asc' ? (
                <>
                  Showing oldest first
                  <ChevronUpIcon className="ml-2 text-gray-400" />
                </>
              ) : (
                <>
                  Showing newest first
                  <ChevronDownIcon className="ml-2 text-gray-400" />
                </>
              )}
            </span>
          </button>
        </div>

        <div className="col-span-full">
          <CallKentEpisodesProvider value={data.episodes}>
            {sortedEpisodes.map(episode => {
              const path = getEpisodePath(episode)
              const keywords = Array.from(
                new Set(
                  episode.keywords
                    .split(/[,;\s]/g) // split into words
                    .map(x => x.trim()) // trim white spaces
                    .filter(Boolean), // remove empties
                ), // omit duplicates
              ).slice(0, 3) // keep first 3 only

              return (
                <div
                  className="border-b border-gray-200 dark:border-gray-600"
                  key={path}
                >
                  <Link to={path} className="group focus:outline-none">
                    <Grid nested className="relative py-10 lg:py-5">
                      <div className="bg-secondary absolute -inset-px group-hover:block group-focus:block hidden -mx-6 rounded-lg" />
                      <div className="relative flex-none col-span-1">
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-focus:opacity-100 group-hover:opacity-100 transform scale-0 group-focus:scale-100 group-hover:scale-100 transition">
                          <div className="flex-none p-4 text-gray-800 bg-white rounded-full">
                            <TriangleIcon size={12} />
                          </div>
                        </div>
                        <img
                          className="w-full h-16 rounded-lg object-cover"
                          src={episode.imageUrl}
                          alt={episode.title}
                        />
                      </div>
                      <div className="text-primary relative flex flex-col col-span-3 md:col-span-7 lg:flex-row lg:col-span-11 lg:items-center lg:justify-between">
                        <div className="mb-3 text-xl font-medium lg:mb-0">
                          {/* For most optimal display, this will needs adjustment once you'll hit 5 digits */}
                          <span
                            className={clsx('inline-block lg:text-lg', {
                              'w-10': numberLength <= 3,
                              'w-14': numberLength === 4,
                              'w-auto pr-4': numberLength > 4,
                            })}
                          >
                            {`${episode.episodeNumber
                              .toString()
                              .padStart(2, '0')}.`}
                          </span>

                          {episode.title}
                        </div>
                        <div className="text-gray-400 text-lg font-medium">
                          {formatTime(episode.duration)}
                        </div>
                      </div>
                    </Grid>
                  </Link>

                  <Grid nested>
                    <AnimatePresence>
                      {selectedEpisode === episode ? (
                        <motion.div
                          variants={{
                            collapsed: {
                              height: 0,
                              marginTop: 0,
                              marginBottom: 0,
                              opacity: 0,
                            },
                            expanded: {
                              height: 'auto',
                              marginTop: '1rem',
                              marginBottom: '3rem',
                              opacity: 1,
                            },
                          }}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          transition={{duration: 0.15}}
                          className="relative col-span-full"
                        >
                          <H6 as="div">Keywords</H6>
                          <Paragraph className="flex mb-8">
                            {keywords.join(', ')}
                          </Paragraph>

                          <H6 as="div">Description</H6>
                          <Paragraph
                            as="div"
                            className="mb-8"
                            dangerouslySetInnerHTML={{
                              __html: episode.description,
                            }}
                          />
                          <Outlet />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </Grid>
                </div>
              )
            })}
          </CallKentEpisodesProvider>
        </div>
      </Grid>

      <BlogSection
        articles={data.blogRecommendations}
        title="Looking for more content?"
        description="Have a look at these articles."
      />
    </>
  )
}
