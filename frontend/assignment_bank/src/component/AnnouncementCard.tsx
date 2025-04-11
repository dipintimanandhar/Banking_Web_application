import  { useState, useEffect, useRef, useCallback } from 'react';
import Card, { CardProps } from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Variants } from 'framer-motion'; // Optional, but good practice
const slidesData = [
  { id: 0, title: "The world's second largest economy is still struggling to recover", imageUrl: './assets/lo' },
  { id: 1, title: 'New breakthroughs announced in renewable energy sources', imageUrl: 'https://via.placeholder.com/600x400.png/558844/FFFFFF?text=Slide+2' },
  { id: 2, title: 'Global tech summit highlights future AI development trends', imageUrl: 'https://via.placeholder.com/600x400.png/993333/FFFFFF?text=Slide+3' },
];


const AUTOPLAY_INTERVAL = 2000;



const slideVariants: Variants = { // Explicitly typing slideVariants is good practice
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    position: 'absolute' as const, // Use 'as const'
    // OR position: 'absolute' as 'absolute', // Alternative assertion
    width: '100%',
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    position: 'relative' as const, // Use 'as const'
    // OR position: 'relative' as 'relative', // Alternative assertion
    width: '100%',
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    position: 'absolute' as const, // Use 'as const'
    // OR position: 'absolute' as 'absolute', // Alternative assertion
    width: '100%',
  }),
};

const slideTransition = {
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 }
};



interface AnnouncementCardProps extends CardProps {}

function AnnouncementCard({ sx, ...rest }: AnnouncementCardProps) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef<number | null>(null);

  const totalSteps = slidesData.length;

  const currentSlide = slidesData[activeStep] || slidesData[0];

  const changeStep = useCallback((newStep: number) => {
    let dir = newStep > activeStep ? 1 : -1;
    if (newStep === 0 && activeStep === totalSteps - 1) dir = 1;
    else if (newStep === totalSteps - 1 && activeStep === 0) dir = -1;
    if (newStep === activeStep) dir = 0;

    setDirection(dir);
    setActiveStep(newStep);

    if (timerRef.current !== null) {
       clearInterval(timerRef.current);
       timerRef.current = null;
     }
  }, [activeStep, totalSteps]);


  useEffect(() => {
    if (!isHovering) {
      timerRef.current = window.setInterval(() => {
        const nextStep = (activeStep + 1) % totalSteps;
        const dir = 1;
        setDirection(dir);
        setActiveStep(nextStep);
      }, AUTOPLAY_INTERVAL);
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeStep, isHovering, totalSteps]);


  return (
    <Card

      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '178px',
        ...sx
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...rest}
    >

      <CardContent
          sx={{
            position: 'relative',
            overflow: 'visible',
           
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            
            color: 'common.white',

            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(30, 40, 100, 0.7)), url(${currentSlide.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background-image 0.5s ease-in-out',
         }}
      >

        <Box sx={{ position: 'relative', flexGrow: 1, overflow: 'hidden',display: 'flex'  }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">

              <motion.div
                key={activeStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                style={{ width: '100%', flexShrink: 0 }} // Added style for flex behavior

              >
                <Box>
                    <Chip
                      label="Announcement"
                      sx={{
                        bgcolor: 'common.white',
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                        
                      }}
                    />
                    <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: 'bold', fontSize:'medium' }}>
                      {currentSlide.title}
                    </Typography>
                    <Link href="#" underline="none" sx={{ color: 'white', display: 'inline-flex', alignItems: 'center' }}>
                      Read More
                      <ArrowForwardIcon sx={{ fontSize: 'inherit' }} />
                    </Link>
                </Box>

              </motion.div>
            </AnimatePresence>
        </Box>


        <Box
          sx={{
            zIndex: 2,
            display: 'flex',
            alignSelf: 'flex-start',
          
          }}
        >
          {Array.from({ length: totalSteps }).map((_, index) => (
            <IconButton
              key={index}
              size="small"
              onClick={() => changeStep(index)}
              aria-label={`Go to slide ${index + 1}`}
              sx={{ p: 0.5 }}
            >
              <FiberManualRecordIcon
                sx={{
                  fontSize: '0.8rem',
                  color: activeStep === index
                    ? theme.palette.warning.main
                    : 'rgba(255, 255, 255, 0.5)',
                  transition: 'color 0.3s',
                }}
              />
            </IconButton>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default AnnouncementCard;