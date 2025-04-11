// src/App.tsx
import React, { useState, useEffect, useCallback, } from 'react';
import { AuthProvider, useAuth } from './component/AuthContext'; // Import your Auth context
import apiClient from './api/axiosInstance'; // Import your configured Axios instance

// --- MUI Imports ---
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import CssBaseline from '@mui/material/CssBaseline'; // Normalize CSS
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Optional: for theme customization
// Optional Icons
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // For Name
import InputAdornment from '@mui/material/InputAdornment';
// Dialog Imports
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
// Custom Components
import AnnouncementCard from './component/AnnouncementCard';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// Assets
import transactionPlaceholderImage from './assets/tr.jpg'; // Placeholder for hidden transactions
import editCartoonImage from './assets/profile.png'; // Background for profile view
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
// --- Interfaces ---
import LogoutIcon from '@mui/icons-material/Logout'; // <-- Add this

// For Transaction data received from backend
interface Transaction {
    transaction_id: number;
    id: number;
    date: string | null;
    user_id: number;
    transaction_date: string; // Received as string (originally datetime)
    description: string | null;
    amount: string; // Received as string (originally Decimal)
    type: 'debit' | 'credit';
    category: string | null;
    created_at: string; // Received as string (originally datetime)
}

// For Profile data received from *our* backend DB
interface DbUserProfile {
    email_address: string;
    name: string;
    phone_number: string | null;
    address: string | null;
}

// Optional: Create a basic MUI theme
const theme = createTheme({
  palette: {
    // mode: 'light', // Keep default light mode or switch to 'dark'
    // primary: { main: '#1976d2' }, // Default blue
  },
});

// --- Helper Functions ---
const formatCurrency = (value: number): string => {
    if (isNaN(value) || typeof value !== 'number') {
        return 'N/A';
    }
    return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }); // Use en-IN for INR
};

const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
          return 'Invalid Date';
      }
      return date.toLocaleDateString('en-GB', { // Use en-GB for dd/mm/yyyy or similar
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
};

const formatAmount = (amountStr: string, type: 'debit' | 'credit'): string => {
    try {
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) return 'Invalid Amount';
        const prefix = type === 'debit' ? '-' : '+';
        // Format with INR symbol using the currency formatter logic
        const formatted = Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return prefix + ' ₹' + formatted; // Add INR symbol manually if needed, or rely on formatCurrency
    } catch {
        return 'Invalid Amount';
    }
}

// --- Inner Content Component (Contains UI Logic) ---
const AppContent: React.FC = () => {
    // --- State Variables ---
    const { profile: googleProfile, isLoggedIn, login, logout, isLoading: authIsLoading } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [dbProfile, setDbProfile] = useState<DbUserProfile | null>(null);
    const [dbProfileLoading, setDbProfileLoading] = useState<boolean>(false);
    const [dbProfileError, setDbProfileError] = useState<string | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
    const [apiMessage, setApiMessage] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState<boolean>(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);
    const [showTransactions, setShowTransactions] = useState<boolean>(true);
    const [totalDebit, setTotalDebit] = useState<number>(0);
    const [totalBalance, setTotalBalance] = useState<number>(0);
    const [openLogoutDialog, setOpenLogoutDialog] = useState<boolean>(false); // State for logout dialog

    // --- Callback Functions for API calls and UI logic ---

    // Function to Fetch Profile from *Our Backend*
    const fetchDbProfile = useCallback(async (email: string) => {
        if (!email) return;
        console.log("Fetching DB profile for:", email);
        setDbProfileLoading(true);
        setDbProfileError(null);
        setApiMessage("Loading profile data...");
        try {
            const response = await apiClient.get<DbUserProfile>(`/profile?email=${encodeURIComponent(email)}`);
            setDbProfile(response.data);
            const fetchedPhone = response.data.phone_number || '';
            const fetchedAddress = response.data.address || '';
            setPhoneNumber(fetchedPhone);
            setAddress(fetchedAddress);
            // Decide if editing should start based on fetched data
            if (!isEditingProfile && (!fetchedPhone || !fetchedAddress)) {
                setIsEditingProfile(true); // Start editing if details are missing and not already editing
                setApiMessage("Profile loaded. Please complete missing details.");
            } else if (!isEditingProfile) {
                setApiMessage("Profile loaded from DB."); // Only set this if not forced into editing
            }
            console.log("DB profile fetched:", response.data);
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                setDbProfile(null);
                setPhoneNumber('');
                setAddress('');
                setIsEditingProfile(true); // Force editing if profile not found
                setApiMessage("No profile found in DB. Please add details.");
                console.log("Profile not found in DB for", email);
            } else {
                console.error("Error fetching DB profile:", error);
                const errorMsg = `Error fetching profile: ${error.response?.data?.error || error.message}`;
                setDbProfileError(errorMsg);
                setApiMessage(errorMsg);
            }
        } finally {
            setDbProfileLoading(false);
        }
    }, [isEditingProfile]); // Added isEditingProfile dependency


    // Function to Fetch Transactions
    const fetchTransactions = useCallback(async () => {
        setTransactionsLoading(true);
        setTransactionsError(null);
        try {
            const response = await apiClient.get<{ transactions: Transaction[] }>('/transactions');
            const fetchedTransactions = response.data.transactions || [];
            setTransactions(fetchedTransactions);

            // Calculate totals
            let debitSum = 0;
            let creditSum = 0;
            fetchedTransactions.forEach(tx => {
                const amount = parseFloat(tx.amount);
                if (!isNaN(amount)) {
                    if (tx.type === 'debit') {
                        debitSum += amount;
                    } else if (tx.type === 'credit') {
                        creditSum += amount;
                    }
                }
            });
            setTotalDebit(debitSum);
            
            setTotalBalance(creditSum - debitSum);

            console.log("Transactions fetched:", response.data);
        } catch (error: any) {
            console.error("Error fetching transactions:", error);
            const errorMsg = `Error fetching transactions: ${error.message}`;
            setTransactionsError(errorMsg);
            setApiMessage(errorMsg);
            setTotalDebit(0);
            
            setTotalBalance(0);
        } finally {
            setTransactionsLoading(false);
        }
    }, []); // Dependency array is correct

    // Function to Handle Profile Update POST
    const handleProfileUpdate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!googleProfile) {
            setApiMessage('Cannot update profile: Google profile not loaded.');
            return;
        }
        setApiMessage('Updating profile...');
        setDbProfileLoading(true);

        const profileUpdateData = {
            email_address: googleProfile.email,
            name: googleProfile.name,
            phone_number: phoneNumber,
            address: address,
        };

        try {
            const response = await apiClient.post('/profile', profileUpdateData);
            console.log("Profile update response:", response.data);
            setApiMessage(`Profile update successful: ${response.data.message || 'OK'}`);
            setIsEditingProfile(false); // Exit editing mode on successful save
            await fetchDbProfile(googleProfile.email); // Refetch profile after update
        } catch (error: any) {
            console.error("Error updating profile:", error);
            setApiMessage(`Error updating profile: ${error.response?.data?.error || error.message}. Check console.`);
            setDbProfileLoading(false); // Ensure loading stops on error
        }
        // Loading is turned off within fetchDbProfile's finally block on success
    };

    // --- Event Handlers for Profile Edit/Cancel ---
    const handleEditClick = () => {
        // Pre-fill with current DB data or empty strings
        setPhoneNumber(dbProfile?.phone_number || '');
        setAddress(dbProfile?.address || '');
        setIsEditingProfile(true);
        setApiMessage("Editing profile details...");
    };

    const handleCancelClick = () => {
        // Reset fields to the last saved DB state
        setPhoneNumber(dbProfile?.phone_number || '');
        setAddress(dbProfile?.address || '');
        setIsEditingProfile(false); // Exit editing mode
        setApiMessage("Edit cancelled.");
    };

    // --- Event Handler for Transaction Visibility ---
    const toggleTransactionVisibility = () => {
        setShowTransactions(prevState => !prevState);
    };

    // --- Logout Dialog Handlers ---
    const handleOpenLogoutDialog = () => {
        setOpenLogoutDialog(true);
    };

    const handleCloseLogoutDialog = () => {
        setOpenLogoutDialog(false);
    };

    const handleConfirmLogout = () => {
        logout(); // Call the actual logout function from context
        handleCloseLogoutDialog(); // Close the dialog
    };

    // --- UseEffect to fetch initial data on Login ---
    useEffect(() => {
        if (isLoggedIn && googleProfile?.email) {
            console.log("User logged in, fetching initial data...");
            fetchTransactions();
            fetchDbProfile(googleProfile.email);
            setShowTransactions(true); // Default to showing transactions on login
        } else {
            console.log("User logged out or Google profile not available.");
            // Clear all relevant state on logout
            setTransactions([]);
            setDbProfile(null);
            setPhoneNumber('');
            setAddress('');
            setIsEditingProfile(false); // Ensure editing mode is off on logout
            setApiMessage(null);
            setDbProfileError(null);
            setTransactionsError(null);
            setShowTransactions(true); // Reset visibility preference
            setTotalDebit(0);
            
            setTotalBalance(0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, googleProfile?.email, fetchDbProfile, fetchTransactions]); // Dependencies are correct


    // --- Component Render Logic ---

    // Initial Authentication Loading State
    if (authIsLoading && !isLoggedIn) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // --- Render different layout based on login state ---
    return (
        <> {/* Use Fragment to avoid unnecessary outer div */}
            {!isLoggedIn ? (
                // --- Logged-Out View: Two-Part Login Screen ---
                <Grid container component="main" sx={{ height: '100vh' }}>
                    {/* Left Side */}
                    <Grid
                        item
                        xs={false}
                        sm={4}
                        md={6}
                        sx={{
                            backgroundColor: '#2c3e50',
                            color: 'white',
                            display: { xs: 'none', sm: 'flex' }, // Hide on xs, flex on sm+
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            p: 4,
                            
                        }}
                        
                    >
                        <Typography component="h1" variant="h2" sx={{ fontWeight: 'bold' }}>
                            Flow Finance
                        </Typography>
                    </Grid>
                    {/* Right Side */}
                    <Grid
                        item
                        xs={12}
                        sm={8} // Takes remaining 8/12 on small screens
                        md={6} // Takes remaining 6/12 on medium screens
                        component={Paper}
                        elevation={6}
                        square
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} // Center content
                    >
                        <Box
                            sx={{
                                p: 4,
                                maxWidth: 'xs', // Limit width of the inner box
                                width: '100%', // Take available width within the grid item
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <Typography component="h1" variant="h4" sx={{ mb: 1 }}>
                                Welcome!
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }} align="center">
                                Sign in with your Google account to continue to Flow Finance.
                            </Typography>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={() => login()}
                                disabled={authIsLoading}
                                sx={{
                                    py: 1.5, fontSize: '1rem', backgroundColor: 'success.main', color: 'white',
                                    '&:hover': { backgroundColor: 'success.dark' }, width:'50%'
                                }}
                            >
                                {authIsLoading ? 'Initializing...' : 'Sign in with Google'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid> // End Login Screen Grid

            ) : (

                // --- Logged-In View: Dashboard Layout ---
                 <Box sx={{ mb: 4, px: { xs: 2, sm: 3 } }}> {/* Use Box for full width, add padding */}

                    {/* Welcome Header */}
                     <Paper elevation={2} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Avatar src={googleProfile?.picture} alt={googleProfile?.name} sx={{ width: 56, height: 56, mr: 2 }}/>
                        <Box sx={{ flexGrow: 1, mr: 2 }}>
                            <Typography variant="h6">Welcome, {googleProfile?.name}!</Typography>
                            <Typography variant="body2" color="textSecondary">{googleProfile?.email}</Typography>
                        </Box>
                        {/* MODIFIED Logout Button */}
                        <Button
                        variant="contained" // Changed from outlined for more emphasis
                        color="error"       // Use error color for logout action
                        onClick={handleOpenLogoutDialog}
                        startIcon={<LogoutIcon />} // Add the icon
                    >
                        Logout
                    </Button>
                    </Paper>

                    <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ display: { xs: 'none', sm: 'block' }, mb: 4 }}>
                         Flow Finance Dashboard
                    </Typography>

                    {/* Summary Cards Row */}
                   {/* Summary Cards Row */}
                   <Grid container spacing={3} sx={{ mb: 4 }}>
                        {/* Announcement Card (remains the same) */}
                        <Grid item xs={12} sm={6} md={3}>
                            <AnnouncementCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} />
                        </Grid>

                        {/* Total Credit Card */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ boxShadow: 3, height: '100%' }}>
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark' }}>
                                            <TrendingUpIcon />
                                        </Avatar>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Account Number
                                        </Typography>
                                    </Stack>
                                    <Typography variant="h4" component="div" sx={{ color: 'success.dark', fontWeight: 'bold', textAlign: 'right' }}> {/* Increased size, darker color */}
                                        456729104745
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Total Debit Card */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ boxShadow: 3, height: '100%' }}>
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'error.light', color: 'error.dark' }}>
                                            <TrendingDownIcon />
                                        </Avatar>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Total Debit
                                        </Typography>
                                    </Stack>
                                    <Typography variant="h4" component="div" sx={{ color: 'error.dark', fontWeight: 'bold', textAlign: 'right' }}> {/* Increased size, darker color */}
                                        {formatCurrency(totalDebit)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Current Balance Card */}
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ boxShadow: 3, height: '100%' }}>
                                <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark' }}>
                                            <AccountBalanceWalletIcon />
                                        </Avatar>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Current Balance
                                        </Typography>
                                    </Stack>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: totalBalance >= 0 ? 'success.dark' : 'error.dark', textAlign: 'right' }}> {/* Increased size, darker colors */}
                                        {formatCurrency(totalBalance)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                     {/* Main Content Grid (Transactions & Profile) */}
                     <Grid container spacing={3}>
                        {/* Transactions Grid Item */}
                        <Grid item xs={12} md={7}>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: { xs: 400, sm: 440, md: 500 } // Stabilize height
                                }}
                            >
                                {/* Header Box */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'medium' }}>
                                        Transaction History
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="outlined" size="small" onClick={toggleTransactionVisibility} startIcon={showTransactions ? <VisibilityOffIcon /> : <VisibilityIcon />}>
                                            {showTransactions ? 'Hide' : 'Show'}
                                        </Button>
                                        {showTransactions && (
                                        <Button variant="contained" size="small" onClick={fetchTransactions} disabled={transactionsLoading} startIcon={<RefreshIcon />}>
                                            {transactionsLoading ? 'Refreshing...' : 'Refresh'}
                                        </Button>
                                        )}
                                    </Stack>
                                </Box>

                               {/* --- Conditional Rendering Area --- */}
                               {showTransactions ? (
                                    // --- Show Transactions ---
                                    <>
                                        {transactionsLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, flexGrow: 1 }}><CircularProgress size={24} /></Box>}
                                        {transactionsError && <Alert severity="error" sx={{mb: 2}}>{transactionsError}</Alert>}
                                        {!transactionsLoading && !transactionsError && (
                                            transactions.length > 0 ? (
                                                <TableContainer sx={{ maxHeight: { xs: 400, sm: 440, md: 500 }, overflowY: 'auto', flexGrow: 1 }}>
                                                    <Table stickyHeader size="small">
                                                        <TableHead>
                                                            <TableRow sx={{ '& th': { fontWeight: 'bold', backgroundColor: theme.palette.grey[200] } }}>
                                                                <TableCell>Date</TableCell>
                                                                <TableCell>Description</TableCell>
                                                                <TableCell>Category</TableCell>
                                                                <TableCell align="right">Amount</TableCell>
                                                                <TableCell align="center">Type</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {transactions.map((row) => (
                                                                <TableRow
                                                                    hover
                                                                    key={row.transaction_id || row.id} // Use a unique key
                                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                                >
                                                                    <TableCell component="th" scope="row" sx={{ whiteSpace: 'nowrap' }}>
                                                                        {formatDate(row.transaction_date || row.date)}
                                                                    </TableCell>
                                                                    <TableCell>{row.description || '-'}</TableCell>
                                                                    <TableCell>{row.category || '-'}</TableCell>
                                                                    <TableCell
                                                                        align="right"
                                                                        sx={{ color: row.type === 'debit' ? 'error.dark' : 'success.dark', fontWeight: 'medium', whiteSpace: 'nowrap' }}
                                                                    >
                                                                        {formatAmount(row.amount, row.type)}
                                                                    </TableCell>
                                                                    <TableCell align="center">
                                                                        <Typography variant="caption" component="span" sx={{
                                                                            color: row.type === 'debit' ? theme.palette.error.contrastText : theme.palette.success.contrastText,
                                                                            bgcolor: row.type === 'debit' ? theme.palette.error.main : theme.palette.success.main,
                                                                            borderRadius: '12px',
                                                                            padding: '3px 10px',
                                                                            textTransform: 'capitalize',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 'medium',
                                                                        }}>
                                                                            {row.type}
                                                                        </Typography>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            ) : (
                                                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                                                        No transactions found.
                                                    </Typography>
                                                </Box>
                                            )
                                        )}
                                    </>
                                ) : (
                                    // --- Show Image when Transactions are Hidden ---
                                    <Box
                                        sx={{
                                            flexGrow: 1, // Fill vertical space
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={transactionPlaceholderImage}
                                            alt="Transactions Hidden"
                                            sx={{
                                                maxWidth: '80%',
                                                maxHeight: '80%',
                                                objectFit: 'contain',
                                                opacity: 0.7,
                                            }}
                                        />
                                    </Box>
                                )}
                            </Paper>
                        </Grid>


                        {/* Profile Grid Item */}
                        <Grid item xs={12} md={5}>
                            <Paper
                                elevation={2}
                                sx={{
                                    // Common styles
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: { xs: 'auto', md: 500 },
                                    position: 'relative',
                                    overflow: 'hidden',

                                    // Conditional Background Styling for VIEW mode
                                    ...(!isEditingProfile && {
                                        backgroundImage: `url(${editCartoonImage})`,
                                        backgroundSize: 'contain',
                                        backgroundPosition: 'center bottom',
                                        backgroundRepeat: 'no-repeat',
                                    }),
                                }}
                            >
                                {/* Inner Box for Content & Overlay */}
                                <Box sx={{
                                    position: 'relative',
                                    zIndex: 1,
                                    flexGrow: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    p: 3, // Apply padding here
                                    // Add overlay ONLY in view mode
                                    ...(!isEditingProfile && {
                                        backgroundColor: 'rgba(255, 255, 255, 0.85)', // White overlay
                                        backdropFilter: 'blur(2px)', // Optional blur
                                    }),
                                }}>
                                    <Typography variant="h5" component="h2" sx={{ mb: 3, color: theme.palette.primary.dark }}>
                                        Profile Information
                                    </Typography>
                                    {dbProfileLoading && !isEditingProfile && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, flexGrow: 1 }}><CircularProgress size={24} /></Box>}
                                    {dbProfileError && <Alert severity="error" sx={{ mb: 2 }}>{dbProfileError}</Alert>}

                                    {!dbProfileError && !dbProfileLoading && (
                                        isEditingProfile ? (
                                            // --- EDITING VIEW ---
                                            <Box component="form" onSubmit={handleProfileUpdate} noValidate sx={{ mt: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                                    <AccountCircleIcon color="primary" />
                                                    <Typography variant="body1"><strong>Name:</strong> {googleProfile?.name}</Typography>
                                                </Stack>
                                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                                    <EmailIcon color="primary" />
                                                    <Typography variant="body1"><strong>Email:</strong> {googleProfile?.email}</Typography>
                                                </Stack>
                                                <TextField
                                                    margin="normal" required fullWidth
                                                    id="phone" label="Phone Number" name="phone"
                                                    autoComplete="tel" value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    disabled={dbProfileLoading}
                                                    InputProps={{
                                                        startAdornment: (<InputAdornment position="start"><PhoneIcon color="primary" /></InputAdornment>),
                                                    }}
                                                />
                                                <TextField
                                                    margin="normal" required fullWidth
                                                    name="address" label="Address" id="address"
                                                    multiline rows={3} value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    disabled={dbProfileLoading}
                                                    InputProps={{
                                                        startAdornment: (<InputAdornment position="start"><HomeIcon color="primary" /></InputAdornment>),
                                                    }}
                                                />
                                                <Box sx={{ flexGrow: 1 }} />
                                                <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
                                                    <Button variant="outlined" onClick={handleCancelClick} disabled={dbProfileLoading} startIcon={<CancelIcon />} >
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" variant="contained" color="success" disabled={dbProfileLoading} startIcon={<SaveIcon />} >
                                                        {dbProfileLoading ? 'Saving...' : 'Save Profile'}
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        ) : (
                                            // --- VIEWING VIEW ---
                                            <Box sx={{ mt: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                <Stack spacing={2.5}>
                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                        <AccountCircleIcon color="primary" />
                                                        <Typography variant="body1"><strong>Name:</strong> {dbProfile?.name || googleProfile?.name}</Typography>
                                                    </Stack>
                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                        <EmailIcon color="primary" />
                                                        <Typography variant="body1"><strong>Email:</strong> {dbProfile?.email_address || googleProfile?.email}</Typography>
                                                    </Stack>
                                                    <Stack direction="row" alignItems="center" spacing={1.5}>
                                                        <PhoneIcon color="primary" />
                                                        <Typography variant="body1"><strong>Phone:</strong> {dbProfile?.phone_number ? dbProfile.phone_number : <Typography component="em" color="text.secondary">Not set</Typography>}</Typography>
                                                    </Stack>
                                                    <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                                        <HomeIcon color="primary" sx={{ mt: 0.5 }} />
                                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}><strong>Address:</strong> {dbProfile?.address ? dbProfile.address : <Typography component="em" color="text.secondary">Not set</Typography>}</Typography>
                                                    </Stack>
                                                </Stack>
                                                <Box sx={{ flexGrow: 1 }} />
                                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button variant="contained" onClick={handleEditClick} startIcon={<EditIcon />} disabled={dbProfileLoading}>
                                                        Edit Profile
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )
                                    )}
                                </Box> {/* End Inner Content Box */}
                            </Paper>
                        </Grid>

                         {/* API Status Message Area */}
                        {apiMessage && (
                            <Grid item xs={12}>
                               <Alert severity={apiMessage.toLowerCase().includes('error') ? 'error' : 'success'} sx={{ mt: 2 }}>
                                   {apiMessage}
                               </Alert>
                            </Grid>
                        )}
                    </Grid> {/* End Main content grid */}

                    {/* --- Logout Confirmation Dialog --- */}
                    <Dialog
                        open={openLogoutDialog}
                        onClose={handleCloseLogoutDialog}
                        aria-labelledby="logout-dialog-title"
                        aria-describedby="logout-dialog-description"
                    >
                        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
                        <DialogContent>
                            <DialogContentText id="logout-dialog-description">
                                Are you sure you want to log out?
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseLogoutDialog} color="primary">
                                Cancel
                            </Button>
                            <Button onClick={handleConfirmLogout} color="error" autoFocus>
                                Logout
                            </Button>
                        </DialogActions>
                    </Dialog>
                    {/* --- End Logout Dialog --- */}

                 </Box> // End Logged-in Box
            )}
        </> // End outer fragment
    );
}


// --- Main App Component Wrapper ---
// Sets up the MUI Theme, CSS Baseline, and AuthProvider
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
        <CssBaseline /> 
        <AuthProvider> 
            <AppContent /> 
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;