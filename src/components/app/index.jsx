import { useState, useEffect } from "react";
import { CardList } from "../card-list";
import { Footer } from "../footer";
import { Header } from "../header";
// import { Sort } from "../sort";
import { Logo } from "../logo";
import { Search } from "../search";
import { dataCard } from "../../data";
import s from "./styles.module.css";
import { Button } from '../button';
import api from '../../utils/api';
import { useDebounce } from '../../hooks/useDebounce';
import { isLiked } from '../../utils/products';
import { CatalogPage } from '../../pages/catalog-page';
import { ProductPage } from '../../pages/product-page';
import FaqPage from '../../pages/faq-page';
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { NotFound } from "../not-found";
import { NotFoundPage } from "../../pages/not-found-page";
import { UserContext } from "../../contexts/current-user-context";
import { CardsContext } from "../../contexts/card-context";
import { ThemeContext, themes } from "../../contexts/theme-context";
import { FavouritesPage } from "../../pages/favourite-page";
import { TABS_ID } from "../../utils/constants";
import Modal from "../modal";
import Register from "../register";
import Login from "../login";
import ResetPassword from "../reset-password";


export function App() {
  const [cards, setCards] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(themes.light);
  const [currentSort, setCurrentSort] = useState('');
  const [modalFormStatus, setModalFormStatus] = useState(true);
  const location = useLocation();

  // const [contacts, setContacts] = useState([]);
  const debounceSearchQuery = useDebounce(searchQuery, 300);
  const backgroundLocation = location.state?.backgroundLocation;
  const navigate = useNavigate();
  const initialPath = location.state?.initialPath;

  const onCloseModalForm = () => {
    setModalFormStatus(false);
  }

  const onCloseRoutingModal = () => {
    navigate(initialPath || '/', {replace: true})
  }

  function handleRequest() {
    api.search(debounceSearchQuery)
      .then((dataSearch) => {
        setCards(dataSearch);
      })
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    handleRequest();
  }

  function handleInputChange(dataInput) {
    setSearchQuery(dataInput);
  }

  function handleUpdateUser(dataUserUpdate) {
    api.setUserInfo(dataUserUpdate)
      .then((updateUserFromServer) => {
        setCurrentUser(updateUserFromServer)
      })
  }

  function handleProductLike(product) {
    const like = isLiked(product.likes, currentUser._id)
    return api.changeLikeProductStatus(product._id, like)
      .then((updateCard) => {
        const newProducts = cards.map(cardState => {
          return cardState._id === updateCard._id ? updateCard : cardState
        })
        setCards(newProducts);

        if(!like) {
          setFavourites(prevState => [...prevState,updateCard])
        } else {
          setFavourites(prevState => prevState.filter(card => card._id !== updateCard._id))
        }

        return updateCard;
      })
  }

  useEffect(() => {
    handleRequest();
  }, [debounceSearchQuery]);


  useEffect(() => {
    setIsLoading(true)
    api.getAllInfo()
      .then(([productsData, userInfoData]) => {
        setCurrentUser(userInfoData);
        setCards(productsData.products); 

        const favouriteProducts = productsData.products.filter(item => isLiked(item.likes, userInfoData._id))
        setFavourites(favouriteProducts)
      })
      .catch(err => console.log(err))
      .finally(() => { setIsLoading(false) })
  }, [])


  function sortedData(currentSort) {
    console.log(currentSort);

    switch (currentSort) {
      case (TABS_ID.CHEAP): setCards(cards.sort((a, b) => a.price - b.price)); break;
      case (TABS_ID.LOW): setCards(cards.sort((a, b) => b.price - a.price)); break;
      case (TABS_ID.DISCOUNT): setCards(cards.sort((a, b) => b.discount - a.discount)); break;
      default: setCards(cards.sort((a, b) => a.price - b.price));
    }

  }

  function toggleTheme() {
    theme === themes.dark ? setTheme(themes.light) : setTheme(themes.dark);
  }

  const cbSubmitFormLoginRegister = (dataForm) => {
        console.log('cbSubmitForm', dataForm);
  }

  const cbSubmitFormResetPassword = (dataForm) => {
    console.log('cbSubmitFormResetPassword', dataForm);
}

  const handleClickButtonReset = (e) => {
    e.preventDefault();
    navigate('/reset-password', {replace:true, state: {backgroundLocation: {...location, state: null}, initialPath}})
  }
  const handleClickButtonLogin = (e) => {
    e.preventDefault();
    navigate('/login', {replace:true, state: {backgroundLocation: {...location, state: null}, initialPath}})
  }
  const handleClickButtonRegister = (e) => {
    e.preventDefault();
    navigate('/register', {replace:true, state: {backgroundLocation: {...location, state: null}, initialPath}})
  }


  const handleClickButtonResetNotModal = (e) => {
    e.preventDefault();
    navigate('/reset-password')
  }
  const handleClickButtonLoginNotModal = (e) => {
    e.preventDefault();
    navigate('/login')
  }
  const handleClickButtonRegisterNotModal = (e) => {
    e.preventDefault();
    navigate('/register')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
    <CardsContext.Provider value={{
      cards,
      favourites,
      currentSort,
      handleLike: handleProductLike,
      isLoading,
      onSortData: sortedData,
      setCurrentSort
    }}>
      <UserContext.Provider value={{ currentUser, onUpdateUser: handleUpdateUser }}>
        <Header user={currentUser}>
          <Routes location={(backgroundLocation && { ...backgroundLocation, pathname: initialPath }) || location}>
            <Route path='/' element={
              <>
                <Logo />
                <Search
                  handleFormSubmit={handleFormSubmit}
                  handleInputChange={handleInputChange}
                />
              </>
            } />
            <Route path='*' element={<Logo href="/" />} />
          </Routes>
        </Header>
        <main className="content container" style={{ backgroundColor: theme.background }}>
          <Routes location={(backgroundLocation && { ...backgroundLocation, pathname: initialPath }) || location}>
            <Route path='/' element={<CatalogPage handleProductLike={handleProductLike} currentUser={currentUser} isLoading={isLoading} />} />
            <Route path='/favourites' element={<FavouritesPage />} />
            <Route path='/faq' element={<FaqPage />} />
            <Route path='/product/:productID' element={<ProductPage />} />
            <Route path='/login' element={
              <Login onSubmit={cbSubmitFormLoginRegister} onNavigateRegister={handleClickButtonRegisterNotModal} onNavigateReset={handleClickButtonResetNotModal}/>} />
            <Route path='/register' element={
                <Register onSubmit={cbSubmitFormLoginRegister} onNavigateLogin={handleClickButtonLoginNotModal}/> } />
            <Route path="/reset-password" element={
                <ResetPassword onSubmit={cbSubmitFormResetPassword}/>}/>
            <Route path='*' element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        {backgroundLocation && <Routes>
          <Route path='/login' element={
            <Modal isOpen onClose={onCloseRoutingModal}>
              <Login onSubmit={cbSubmitFormLoginRegister} onNavigateRegister={handleClickButtonRegister} onNavigateReset={handleClickButtonReset}/>
            </Modal>
          } />
          <Route path='/register' element={
            <Modal isOpen onClose={onCloseRoutingModal}>
              <Register onSubmit={cbSubmitFormLoginRegister} onNavigateLogin={handleClickButtonLogin}/>
            </Modal>
          } />
          <Route path="/reset-password" element={
            <Modal isOpen onClose={onCloseRoutingModal}>
              <ResetPassword onSubmit={cbSubmitFormResetPassword}/>
            </Modal>
          }/>
        </Routes>}
      </UserContext.Provider>
    </CardsContext.Provider >
  </ThemeContext.Provider >
);
}