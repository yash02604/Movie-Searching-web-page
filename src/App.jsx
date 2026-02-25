
import React, { useEffect, useState } from 'react';
import Search from './Component/Search.jsx';
import Spinner from './Component/Spinner.jsx';
import MovieCard from './Component/moviecard.jsx';
import {useDebounce} from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [trendingMovies, setTrendingMovies] = useState([]);

  useDebounce( () => setDebouncedSearchTerm(searchTerm) , 500 , [searchTerm])

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const trimmedQuery = query.trim();
      const endpoint = trimmedQuery
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(trimmedQuery)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      console.log(`Fetching from: ${endpoint}`);

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.results || data.results.length === 0) {
        setErrorMessage('No movies found.');
        setMovieList([]);

        
        return;
      }

      setMovieList(data.results);
      
      if(trimmedQuery && data.results.length > 0){
        await updateSearchCount(trimmedQuery, data.results[0]);
      }


    } catch (error) {
      console.error('Error fetching movies:', error.message);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
          const movies = await getTrendingMovies();
          setTrendingMovies(movies);

    }catch(error){
      console.log(`Error fetching trending movies: ${error}`);
    }
  }


  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);
  
  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero1.png" alt="Hero banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> that You'll Enjoy Without{' '}
            <span className="text-gradient">Hassle</span>
          </h1>

          {/* Fixed prop passing */}
          <Search SearchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}


        <section className="all-movies">
          <h2 >All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
