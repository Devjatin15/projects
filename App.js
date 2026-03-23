import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StatusBar, SafeAreaView, ActivityIndicator,
  Dimensions, Linking, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, confirmPasswordReset
} from 'firebase/auth';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot
} from 'firebase/firestore';

const { width } = Dimensions.get('window');
const TODAY = new Date();
const CATS = [
  { id: 'work',     label: 'Work',     color: '#4F8EF7' },
  { id: 'study',    label: 'Study',    color: '#A78BFA' },
  { id: 'personal', label: 'Personal', color: '#34D399' },
  { id: 'fitness',  label: 'Fitness',  color: '#F97316' },
  { id: 'health',   label: 'Health',   color: '#F43F5E' },
];
const PRIS = [
  { id: 'high',   label: 'High',   color: '#F43F5E' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'low',    label: 'Low',    color: '#10B981' },
];
const MFULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const BACKDROPS = [
  { id: 'minimal',  label: 'Minimal',  colors: ['#F8F9FC','#E8ECF8'],           emoji: '🤍' },
  { id: 'dark',     label: 'Dark',     colors: ['#0F1117','#1A1D27'],           emoji: '🖤' },
  { id: 'ocean',    label: 'Ocean',    colors: ['#0F2027','#203A43','#2C5364'], emoji: '🌊' },
  { id: 'forest',   label: 'Forest',   colors: ['#134E5E','#71B280'],           emoji: '🌿' },
  { id: 'sky',      label: 'Sky',      colors: ['#87CEEB','#E0F7FA','#FFFFFF'], emoji: '☁️' },
  { id: 'sunset',   label: 'Sunset',   colors: ['#FF512F','#F09819'],           emoji: '🌅' },
  { id: 'galaxy',   label: 'Galaxy',   colors: ['#0F0C29','#302B63','#24243E'], emoji: '🌌' },
  { id: 'rose',     label: 'Rose',     colors: ['#F8CDDA','#1D2B64'],           emoji: '🌸' },
  { id: 'mint',     label: 'Mint',     colors: ['#E0F7F4','#B2EBF2','#FFFFFF'], emoji: '🍃' },
  { id: 'lavender', label: 'Lavender', colors: ['#E8D5F5','#C9B8E8','#F0E6FF'], emoji: '💜' },
];

const CALM_PLAYLISTS = [
  { id: '1', label: 'Deep Focus',    emoji: '🧠', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  { id: '2', label: 'Chill Lofi',    emoji: '🎵', url: 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS' },
  { id: '3', label: 'Nature Sounds', emoji: '🌿', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4PP3DA4J0N8' },
  { id: '4', label: 'Piano Calm',    emoji: '🎹', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
  { id: '5', label: 'Sleep Sounds',  emoji: '😴', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZd79rJ6a7lp' },
  { id: '6', label: 'Morning Vibes', emoji: '☀️', url: 'https://open.spotify.com/playlist/37i9dQZF1DXc5e2bJhV6pu' },
];

const POMO_PHASES = { work: 25*60, short: 5*60, long: 15*60 };

function pad(n){ return String(n).padStart(2,'0'); }
function dk(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function addDays(d,n){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function sameDay(a,b){ return dk(a)===dk(b); }

function getTheme(backdropId){
  const dark=['dark','ocean','forest','galaxy','rose','sunset'].includes(backdropId);
  return {
    isDark: dark,
    text:  dark?'#E8E9F0':'#1A1B2E',
    text2: dark?'#8B8FA8':'#6B7280',
    text3: dark?'#555A75':'#9CA3AF',
    card:  dark?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.85)',
    card2: dark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.6)',
    bdr:   dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.08)',
    input: dark?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.9)',
  };
}

// ─── ANIMATED BUTTON ─────────────────────────────────────────
function SciFiButton({ onPress, style, children, color='#4F8EF7', glow=true }){
  const scale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  function pressIn(){
    Animated.parallel([
      Animated.spring(scale,{toValue:0.96,useNativeDriver:true,tension:300,friction:10}),
      Animated.timing(glowAnim,{toValue:1,duration:150,useNativeDriver:false}),
    ]).start();
  }
  function pressOut(){
    Animated.parallel([
      Animated.spring(scale,{toValue:1,useNativeDriver:true,tension:300,friction:10}),
      Animated.timing(glowAnim,{toValue:0,duration:200,useNativeDriver:false}),
    ]).start();
  }

  const borderColor = glowAnim.interpolate({
    inputRange:[0,1],
    outputRange:['rgba(79,142,247,0.2)',color]
  });

  return(
    <Animated.View style={[{transform:[{scale}]},style]}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
        activeOpacity={1}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── ANIMATED CARD ────────────────────────────────────────────
function AnimCard({ children, style, onPress }){
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  function pressIn(){
    Animated.parallel([
      Animated.spring(scale,{toValue:1.02,useNativeDriver:true,tension:300,friction:10}),
      Animated.spring(translateY,{toValue:-3,useNativeDriver:true,tension:300,friction:10}),
    ]).start();
  }
  function pressOut(){
    Animated.parallel([
      Animated.spring(scale,{toValue:1,useNativeDriver:true,tension:300,friction:10}),
      Animated.spring(translateY,{toValue:0,useNativeDriver:true,tension:300,friction:10}),
    ]).start();
  }

  if(!onPress) return <Animated.View style={[style,{transform:[{scale},{translateY}]}]}>{children}</Animated.View>;

  return(
    <Animated.View style={[style,{transform:[{scale},{translateY}]}]}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={1}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── GLITCH TEXT ──────────────────────────────────────────────
function GlitchText({ text, style }){
  const [glitch, setGlitch] = useState(false);
  useEffect(()=>{
    const interval = setInterval(()=>{
      setGlitch(true);
      setTimeout(()=>setGlitch(false), 100);
    }, 4000);
    return ()=>clearInterval(interval);
  },[]);

  return(
    <Text style={[style,{
      textShadowColor: glitch?'#F43F5E':'transparent',
      textShadowOffset:{width:glitch?2:0,height:0},
      textShadowRadius:glitch?4:0,
    }]}>{text}</Text>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────
function AuthScreen(){
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [resetMode,setResetMode]=useState(false);
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [oobCode,setOobCode]=useState(null);
  const [resetSuccess,setResetSuccess]=useState(false);
  const fadeAnim=useRef(new Animated.Value(0)).current;
  const slideAnim=useRef(new Animated.Value(30)).current;

  useEffect(()=>{
    Animated.parallel([
      Animated.timing(fadeAnim,{toValue:1,duration:800,useNativeDriver:true}),
      Animated.spring(slideAnim,{toValue:0,tension:60,friction:10,useNativeDriver:true}),
    ]).start();
    try{
      const url=window.location?.href||'';
      const parts=url.split('?');
      if(parts.length>1){
        const params=new URLSearchParams(parts[1]);
        const urlMode=params.get('mode');
        const code=params.get('oobCode');
        if(urlMode==='resetPassword'&&code){ setOobCode(code); setResetMode(true); }
      }
    }catch(e){}
  },[]);

  async function handleAuth(){
    if(!email||!password){setError('Please enter email and password');return;}
    setLoading(true);setError('');
    try{
      if(mode==='login') await signInWithEmailAndPassword(auth,email,password);
      else await createUserWithEmailAndPassword(auth,email,password);
    }catch(e){setError(e.message.replace('Firebase: ','').replace(/\(auth.*\)/,''));}
    setLoading(false);
  }

  async function handleForgotPassword(){
    if(!email){setError('Enter your email first');return;}
    try{
      await sendPasswordResetEmail(auth,email,{url:'https://tadalist.netlify.app',handleCodeInApp:true});
      setError('✅ Reset email sent! Check your inbox.');
    }catch(e){setError(e.message.replace('Firebase: ','').replace(/\(auth.*\)/,''));}
  }

  async function handleResetPassword(){
    if(!newPassword||!confirmPassword){setError('Please fill in both fields');return;}
    if(newPassword!==confirmPassword){setError('Passwords do not match');return;}
    if(newPassword.length<6){setError('Password must be at least 6 characters');return;}
    setLoading(true);setError('');
    try{
      await confirmPasswordReset(auth,oobCode,newPassword);
      setResetSuccess(true);setResetMode(false);setOobCode(null);
    }catch(e){setError(e.message.replace('Firebase: ','').replace(/\(auth.*\)/,''));}
    setLoading(false);
  }

  if(resetMode){
    return(
      <LinearGradient colors={['#0F1117','#1A1D27','#2D1B69']} style={{flex:1,justifyContent:'center',padding:24}}>
        <StatusBar barStyle="light-content"/>
        <Text style={{fontSize:36,fontWeight:'800',color:'#4F8EF7',textAlign:'center',marginBottom:6}}>🐸 Tadalist</Text>
        <View style={{backgroundColor:'rgba(255,255,255,0.07)',borderRadius:20,padding:24,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'}}>
          <Text style={{fontSize:18,fontWeight:'700',color:'#E8E9F0',marginBottom:20,textAlign:'center'}}>Reset Password 🔒</Text>
          <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="New password" placeholderTextColor="#555A75" secureTextEntry
            style={{backgroundColor:'rgba(255,255,255,0.08)',borderWidth:1,borderColor:'rgba(255,255,255,0.1)',borderRadius:10,padding:12,color:'#E8E9F0',fontSize:13,marginBottom:12}}/>
          <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" placeholderTextColor="#555A75" secureTextEntry
            style={{backgroundColor:'rgba(255,255,255,0.08)',borderWidth:1,borderColor:'rgba(255,255,255,0.1)',borderRadius:10,padding:12,color:'#E8E9F0',fontSize:13,marginBottom:16}}/>
          {error?<Text style={{color:'#F43F5E',fontSize:12,marginBottom:12,textAlign:'center'}}>{error}</Text>:null}
          <SciFiButton onPress={handleResetPassword} color="#4F8EF7">
            <View style={{backgroundColor:'#4F8EF7',borderRadius:12,padding:14,alignItems:'center'}}>
              {loading?<ActivityIndicator color="#fff"/>:<Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>Set New Password</Text>}
            </View>
          </SciFiButton>
        </View>
      </LinearGradient>
    );
  }

  if(resetSuccess){
    return(
      <LinearGradient colors={['#0F1117','#1A1D27','#2D1B69']} style={{flex:1,justifyContent:'center',padding:24,alignItems:'center'}}>
        <Text style={{fontSize:70,marginBottom:16}}>🎉</Text>
        <Text style={{fontSize:22,fontWeight:'800',color:'#E8E9F0',marginBottom:8}}>Password Reset!</Text>
        <Text style={{fontSize:14,color:'#8B8FA8',textAlign:'center',marginBottom:32}}>Sign in with your new password.</Text>
        <SciFiButton onPress={()=>setResetSuccess(false)} color="#4F8EF7">
          <View style={{backgroundColor:'#4F8EF7',borderRadius:12,padding:14,paddingHorizontal:32}}>
            <Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>Sign In Now →</Text>
          </View>
        </SciFiButton>
      </LinearGradient>
    );
  }

  return(
    <LinearGradient colors={['#0F1117','#1A1D27','#2D1B69']} style={{flex:1,justifyContent:'center',padding:24}}>
      <StatusBar barStyle="light-content"/>

      {/* Animated entrance */}
      <Animated.View style={{opacity:fadeAnim,transform:[{translateY:slideAnim}]}}>
        <GlitchText text="🐸 Tadalist" style={{fontSize:36,fontWeight:'800',color:'#4F8EF7',textAlign:'center',marginBottom:6}}/>
        <Text style={{fontSize:14,color:'#8B8FA8',textAlign:'center',marginBottom:8}}>Your chaotic productivity companion</Text>

        {/* Sci-fi divider */}
        <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:32}}>
          <View style={{flex:1,height:1,backgroundColor:'rgba(79,142,247,0.3)'}}/>
          <View style={{width:6,height:6,borderRadius:3,backgroundColor:'#4F8EF7'}}/>
          <View style={{flex:1,height:1,backgroundColor:'rgba(79,142,247,0.3)'}}/>
        </View>

        <View style={{backgroundColor:'rgba(255,255,255,0.04)',borderRadius:20,padding:24,borderWidth:1,borderColor:'rgba(79,142,247,0.2)'}}>
          {/* Sci-fi header bar */}
          <View style={{flexDirection:'row',alignItems:'center',marginBottom:20,gap:6}}>
            {[...Array(3)].map((_,i)=>(
              <View key={i} style={{width:8,height:8,borderRadius:4,backgroundColor:i===0?'#F43F5E':i===1?'#F59E0B':'#34D399'}}/>
            ))}
            <Text style={{color:'rgba(79,142,247,0.5)',fontSize:10,marginLeft:6,letterSpacing:2,textTransform:'uppercase'}}>
              {mode==='login'?'auth.login':'auth.register'}
            </Text>
          </View>

          <Text style={{fontSize:11,color:'#4F8EF7',marginBottom:4,letterSpacing:1,textTransform:'uppercase'}}>// Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="user@domain.com" placeholderTextColor="#555A75"
            keyboardType="email-address" autoCapitalize="none"
            style={{backgroundColor:'rgba(79,142,247,0.05)',borderWidth:1,borderColor:'rgba(79,142,247,0.25)',borderRadius:10,padding:12,color:'#E8E9F0',fontSize:13,marginBottom:14,fontFamily:'monospace'}}/>

          <Text style={{fontSize:11,color:'#4F8EF7',marginBottom:4,letterSpacing:1,textTransform:'uppercase'}}>// Password</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#555A75" secureTextEntry
            style={{backgroundColor:'rgba(79,142,247,0.05)',borderWidth:1,borderColor:'rgba(79,142,247,0.25)',borderRadius:10,padding:12,color:'#E8E9F0',fontSize:13,marginBottom:16}}/>

          {error?<Text style={{color:error.startsWith('✅')?'#34D399':'#F43F5E',fontSize:12,marginBottom:12,textAlign:'center'}}>{error}</Text>:null}

          <SciFiButton onPress={handleAuth} color="#4F8EF7">
            <View style={{backgroundColor:'rgba(79,142,247,0.15)',borderWidth:1,borderColor:'#4F8EF7',borderRadius:12,padding:14,alignItems:'center'}}>
              {loading?<ActivityIndicator color="#4F8EF7"/>:<Text style={{color:'#4F8EF7',fontWeight:'800',fontSize:15,letterSpacing:1}}>{mode==='login'?'[ SIGN IN ]':'[ CREATE ACCOUNT ]'}</Text>}
            </View>
          </SciFiButton>

          <View style={{flexDirection:'row',alignItems:'center',marginVertical:14,gap:8}}>
            <View style={{flex:1,height:1,backgroundColor:'rgba(255,255,255,0.06)'}}/>
            <Text style={{color:'#555A75',fontSize:10,letterSpacing:2}}>SYS</Text>
            <View style={{flex:1,height:1,backgroundColor:'rgba(255,255,255,0.06)'}}/>
          </View>

          <TouchableOpacity onPress={()=>{setMode(m=>m==='login'?'register':'login');setError('');}} style={{alignItems:'center',marginBottom:10}}>
            <Text style={{color:'#4F8EF7',fontSize:12,letterSpacing:.5}}>{mode==='login'?'> new_user.register()':'> existing_user.login()'}</Text>
          </TouchableOpacity>

          {mode==='login'&&(
            <TouchableOpacity onPress={handleForgotPassword} style={{alignItems:'center'}}>
              <Text style={{color:'#555A75',fontSize:11,letterSpacing:.5}}>{'> forgot_password()'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [tasks,setTasks]=useState([]);
  const [backdrop,setBackdrop]=useState('dark');
  const [tab,setTab]=useState('calendar');
  const [view,setView]=useState('month');
  const [focusDate,setFocusDate]=useState(new Date(TODAY));
  const [modal,setModal]=useState(null);
  const [search,setSearch]=useState('');
  const [filterCat,setFilterCat]=useState('all');
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [pomoPhase,setPomoPhase]=useState('work');
  const [pomoSec,setPomoSec]=useState(POMO_PHASES.work);
  const [pomoRunning,setPomoRunning]=useState(false);
  const [pomoCycles,setPomoCycles]=useState(0);
  const pomoRef=useRef(null);
  const sidebarAnim=useRef(new Animated.Value(-280)).current;
  const overlayAnim=useRef(new Animated.Value(0)).current;
  const headerAnim=useRef(new Animated.Value(0)).current;

  const th=getTheme(backdrop);
  const bd=BACKDROPS.find(b=>b.id===backdrop)||BACKDROPS[1];

  useEffect(()=>{
    Animated.timing(headerAnim,{toValue:1,duration:600,useNativeDriver:true}).start();
  },[]);

  function openSidebar(){
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(sidebarAnim,{toValue:0,useNativeDriver:true,tension:65,friction:11}),
      Animated.timing(overlayAnim,{toValue:1,duration:300,useNativeDriver:true}),
    ]).start();
  }

  function closeSidebar(){
    Animated.parallel([
      Animated.spring(sidebarAnim,{toValue:-280,useNativeDriver:true,tension:65,friction:11}),
      Animated.timing(overlayAnim,{toValue:0,duration:250,useNativeDriver:true}),
    ]).start(()=>setSidebarOpen(false));
  }

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,u=>{setUser(u);setAuthLoading(false);});
    return unsub;
  },[]);

  useEffect(()=>{
    if(!user)return;
    const q=query(collection(db,'tasks'),where('userId','==',user.uid));
    const unsub=onSnapshot(q,snap=>{
      setTasks(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
    return unsub;
  },[user]);

  useEffect(()=>{
    if(pomoRunning){
      pomoRef.current=setInterval(()=>{
        setPomoSec(s=>{
          if(s<=1){
            clearInterval(pomoRef.current);setPomoRunning(false);
            const next=pomoPhase==='work'?(pomoCycles%3===2?'long':'short'):'work';
            if(pomoPhase==='work')setPomoCycles(c=>c+1);
            setPomoPhase(next);return POMO_PHASES[next];
          }
          return s-1;
        });
      },1000);
    }else clearInterval(pomoRef.current);
    return()=>clearInterval(pomoRef.current);
  },[pomoRunning,pomoPhase]);

  async function addTask(t){if(!user)return;await addDoc(collection(db,'tasks'),{...t,userId:user.uid,createdAt:new Date().toISOString()});}
  async function updateTask(t){if(!user)return;const{id,...data}=t;await updateDoc(doc(db,'tasks',id),data);}
  async function removeTask(id){if(!user)return;await deleteDoc(doc(db,'tasks',id));}
  async function toggleTask(id){const t=tasks.find(x=>x.id===id);if(t)await updateTask({...t,done:!t.done});}
  async function saveModal(t){if(!t?.title)return;if(t.id)await updateTask(t);else await addTask(t);setModal(null);}

  if(authLoading)return(
    <LinearGradient colors={['#0F1117','#1A1D27']} style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <ActivityIndicator size="large" color="#4F8EF7"/>
      <Text style={{color:'#4F8EF7',marginTop:12,fontSize:12,letterSpacing:2}}>INITIALIZING...</Text>
    </LinearGradient>
  );
  if(!user)return <AuthScreen/>;

  const filtered=tasks.filter(t=>(!search||t.title.toLowerCase().includes(search.toLowerCase()))&&(filterCat==='all'||t.cat===filterCat));
  const todayTasks=tasks.filter(t=>t.date===dk(TODAY));
  const score=todayTasks.length?Math.round(todayTasks.filter(t=>t.done).length/todayTasks.length*100):0;
  function tod(d){return filtered.filter(t=>t.date===dk(d));}

  const yr=focusDate.getFullYear(),mo=focusDate.getMonth();
  const firstDay=new Date(yr,mo,1).getDay();
  const dim=new Date(yr,mo+1,0).getDate();
  const cells=[];
  for(let i=0;i<firstDay;i++)cells.push(null);
  for(let d=1;d<=dim;d++)cells.push(new Date(yr,mo,d));

  const pomoMM=Math.floor(pomoSec/60),pomoSS=pomoSec%60;
  const pomoTotal=POMO_PHASES[pomoPhase];
  const pomoPct=(pomoTotal-pomoSec)/pomoTotal;
  const POMOCOLOR={work:'#4F8EF7',short:'#34D399',long:'#A78BFA'};

  function buildHeatmap(){
    const map={};
    tasks.forEach(t=>{
      if(!map[t.date])map[t.date]={done:0,total:0};
      map[t.date].total++;
      if(t.done)map[t.date].done++;
    });
    return map;
  }

  function getAccountabilityData(){
    const thisWeekStart=addDays(TODAY,-TODAY.getDay());
    const thisMonthStart=new Date(TODAY.getFullYear(),TODAY.getMonth(),1);
    const dayTasks=tasks.filter(t=>t.date===dk(TODAY));
    const weekTasks=tasks.filter(t=>{const d=new Date(t.date+'T00:00:00');return d>=thisWeekStart&&d<=TODAY;});
    const monthTasks=tasks.filter(t=>{const d=new Date(t.date+'T00:00:00');return d>=thisMonthStart&&d<=TODAY;});
    const dayScore=dayTasks.length?Math.round(dayTasks.filter(t=>t.done).length/dayTasks.length*100):0;
    const weekScore=weekTasks.length?Math.round(weekTasks.filter(t=>t.done).length/weekTasks.length*100):0;
    const monthScore=monthTasks.length?Math.round(monthTasks.filter(t=>t.done).length/monthTasks.length*100):0;
    const topCat=CATS.map(c=>({...c,count:tasks.filter(t=>t.cat===c.id&&t.done).length})).sort((a,b)=>b.count-a.count)[0];
    const streak=(()=>{
      let s=0,d=new Date(TODAY);
      while(true){const dt=tasks.filter(t=>t.date===dk(d));if(dt.length>0&&dt.every(t=>t.done))s++;else break;d=addDays(d,-1);}
      return s;
    })();
    function msg(score,period){
      if(score===0)return`No tasks recorded ${period} yet 💪`;
      if(score>=90)return`Absolutely crushing it ${period}! 🔥`;
      if(score>=70)return`Great work ${period}! ${score}% done ⭐`;
      if(score>=50)return`Good progress ${period}! Finish strong 💪`;
      if(score>=30)return`Keep pushing ${period}! 🌱`;
      return`Fresh start coming ${period}! ✨`;
    }
    return{dayScore,weekScore,monthScore,dayTasks,weekTasks,monthTasks,topCat,streak,
      dayMsg:msg(dayScore,'today'),weekMsg:msg(weekScore,'this week'),monthMsg:msg(monthScore,'this month')};
  }

  const acc=getAccountabilityData();
  const heatmap=buildHeatmap();

  const SIDEBAR_ITEMS=[
    {id:'calendar', emoji:'📆', label:'Calendar'},
    {id:'pomodoro', emoji:'🍅', label:'Focus Timer'},
    {id:'heatmap',  emoji:'🔥', label:'Heatmap'},
    {id:'account',  emoji:'📊', label:'Progress'},
    {id:'spotify',  emoji:'🎵', label:'Music'},
    {id:'backdrop', emoji:'🎨', label:'Themes'},
    {id:'settings', emoji:'⚙️', label:'Settings'},
  ];

  return(
    <LinearGradient colors={bd.colors.length>=3?bd.colors:[bd.colors[0],bd.colors[1],bd.colors[0]]} style={{flex:1}}>
      <SafeAreaView style={{flex:1}}>
        <StatusBar barStyle={th.isDark?'light-content':'dark-content'}/>

        {/* HEADER */}
        <Animated.View style={{opacity:headerAnim,paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'rgba(79,142,247,0.2)',flexDirection:'row',alignItems:'center',backgroundColor:'rgba(0,0,0,0.2)'}}>
          <SciFiButton onPress={openSidebar} color="#4F8EF7">
            <View style={{padding:9,borderRadius:12,backgroundColor:'rgba(79,142,247,0.1)',borderWidth:1,borderColor:'rgba(79,142,247,0.3)',marginRight:12}}>
              <Text style={{fontSize:16,lineHeight:18,color:'#4F8EF7'}}>☰</Text>
            </View>
          </SciFiButton>
          <GlitchText text="🐸 Tadalist" style={{fontSize:18,fontWeight:'800',color:'#4F8EF7',letterSpacing:.5}}/>
          <View style={{marginLeft:8,flexDirection:'row',alignItems:'center',gap:3}}>
            <View style={{width:6,height:6,borderRadius:3,backgroundColor:'#34D399'}}/>
            <Text style={{fontSize:9,color:'#34D399',letterSpacing:1}}>LIVE</Text>
          </View>
          <SciFiButton onPress={()=>setModal({title:'',date:dk(focusDate),time:'09:00',dur:30,cat:'work',pri:'medium',notes:'',recur:'none'})} color="#4F8EF7" style={{marginLeft:'auto'}}>
            <View style={{backgroundColor:'rgba(79,142,247,0.15)',borderWidth:1,borderColor:'#4F8EF7',paddingVertical:8,paddingHorizontal:16,borderRadius:10}}>
              <Text style={{color:'#4F8EF7',fontWeight:'800',fontSize:13,letterSpacing:1}}>+ NEW</Text>
            </View>
          </SciFiButton>
        </Animated.View>

        <ScrollView style={{flex:1}} contentContainerStyle={{padding:14}}>

          {/* ── CALENDAR TAB ── */}
          {tab==='calendar'&&(
            <View>
              <AnimCard style={{backgroundColor:th.card,borderRadius:14,padding:14,marginBottom:12,borderWidth:1,borderColor:'rgba(79,142,247,0.2)'}}>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <Text style={{fontSize:11,color:'#4F8EF7',fontWeight:'700',letterSpacing:1,textTransform:'uppercase'}}>// Daily Score</Text>
                  <Text style={{fontSize:22,fontWeight:'800',color:score>=70?'#34D399':score>=40?'#F59E0B':'#F43F5E'}}>{score}%</Text>
                </View>
                <View style={{backgroundColor:'rgba(255,255,255,0.05)',borderRadius:4,height:6,overflow:'hidden'}}>
                  <Animated.View style={{width:`${score}%`,height:6,borderRadius:4,backgroundColor:score>=70?'#34D399':score>=40?'#F59E0B':'#F43F5E'}}/>
                </View>
                <Text style={{fontSize:11,color:th.text3,marginTop:4}}>{todayTasks.filter(t=>t.done).length}/{todayTasks.length} tasks done</Text>
              </AnimCard>

              <TextInput value={search} onChangeText={setSearch} placeholder="// search tasks…" placeholderTextColor={th.text3}
                style={{backgroundColor:'rgba(79,142,247,0.05)',borderWidth:1,borderColor:'rgba(79,142,247,0.2)',borderRadius:10,padding:10,color:th.text,fontSize:13,marginBottom:10,fontFamily:'monospace'}}/>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
                <View style={{flexDirection:'row',gap:6}}>
                  {[{id:'all',label:'ALL',color:'#4F8EF7'},...CATS.map(c=>({...c,label:c.label.toUpperCase()}))].map(c=>(
                    <SciFiButton key={c.id} onPress={()=>setFilterCat(c.id)} color={c.color}>
                      <View style={{backgroundColor:filterCat===c.id?c.color+'33':'transparent',borderWidth:1,borderColor:filterCat===c.id?c.color:'rgba(255,255,255,0.1)',borderRadius:20,paddingVertical:5,paddingHorizontal:12}}>
                        <Text style={{color:filterCat===c.id?c.color:th.text2,fontSize:10,fontWeight:'700',letterSpacing:1}}>{c.label}</Text>
                      </View>
                    </SciFiButton>
                  ))}
                </View>
              </ScrollView>

              <View style={{flexDirection:'row',gap:6,marginBottom:12}}>
                {['month','week','day','agenda'].map(v=>(
                  <SciFiButton key={v} onPress={()=>setView(v)} color="#4F8EF7">
                    <View style={{backgroundColor:view===v?'rgba(79,142,247,0.2)':'transparent',borderWidth:1,borderColor:view===v?'#4F8EF7':'rgba(255,255,255,0.1)',borderRadius:8,paddingVertical:5,paddingHorizontal:10}}>
                      <Text style={{color:view===v?'#4F8EF7':th.text2,fontSize:10,fontWeight:'700',letterSpacing:1,textTransform:'uppercase'}}>{v}</Text>
                    </View>
                  </SciFiButton>
                ))}
              </View>

              {view==='month'&&(
                <View>
                  <View style={{flexDirection:'row',alignItems:'center',marginBottom:10}}>
                    <SciFiButton onPress={()=>setFocusDate(new Date(yr,mo-1,1))} color="#4F8EF7">
                      <View style={{padding:8,borderRadius:8,borderWidth:1,borderColor:'rgba(79,142,247,0.3)',backgroundColor:'rgba(79,142,247,0.05)'}}>
                        <Text style={{color:'#4F8EF7'}}>‹</Text>
                      </View>
                    </SciFiButton>
                    <Text style={{flex:1,textAlign:'center',fontSize:16,fontWeight:'700',color:th.text,letterSpacing:.5}}>{MFULL[mo]} {yr}</Text>
                    <SciFiButton onPress={()=>setFocusDate(new Date(yr,mo+1,1))} color="#4F8EF7">
                      <View style={{padding:8,borderRadius:8,borderWidth:1,borderColor:'rgba(79,142,247,0.3)',backgroundColor:'rgba(79,142,247,0.05)'}}>
                        <Text style={{color:'#4F8EF7'}}>›</Text>
                      </View>
                    </SciFiButton>
                  </View>
                  <View style={{flexDirection:'row',marginBottom:4}}>
                    {DAYS.map(d=><Text key={d} style={{flex:1,textAlign:'center',fontSize:10,fontWeight:'700',color:'#4F8EF7',letterSpacing:1,opacity:.6}}>{d}</Text>)}
                  </View>
                  <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                    {cells.map((d,i)=>{
                      if(!d)return<View key={i} style={{width:'14.28%',height:68}}/>;
                      const isToday=sameDay(d,TODAY);
                      const ts=tod(d);
                      return(
                        <AnimCard key={i} onPress={()=>{setFocusDate(d);setView('day');}}
                          style={{width:'14.28%',height:68,padding:2,borderWidth:0.5,borderColor:isToday?'rgba(79,142,247,0.5)':'rgba(79,142,247,0.1)',backgroundColor:isToday?'rgba(79,142,247,0.15)':th.card2}}>
                          <Text style={{fontSize:11,fontWeight:isToday?'800':'400',color:isToday?'#4F8EF7':th.text}}>{d.getDate()}</Text>
                          {ts.slice(0,2).map(t=>{
                            const c=CATS.find(x=>x.id===t.cat);
                            return<View key={t.id} style={{backgroundColor:c?c.color+'44':'#ccc3',borderRadius:2,marginTop:1,paddingHorizontal:2}}>
                              <Text numberOfLines={1} style={{fontSize:8,color:c?c.color:'#888',fontWeight:'600'}}>{t.title}</Text>
                            </View>;
                          })}
                          {ts.length>2&&<Text style={{fontSize:8,color:th.text3}}>+{ts.length-2}</Text>}
                        </AnimCard>
                      );
                    })}
                  </View>
                </View>
              )}

              {view==='day'&&(
                <View>
                  <View style={{flexDirection:'row',alignItems:'center',marginBottom:10}}>
                    <SciFiButton onPress={()=>setFocusDate(addDays(focusDate,-1))} color="#4F8EF7">
                      <View style={{padding:8,borderRadius:8,borderWidth:1,borderColor:'rgba(79,142,247,0.3)',backgroundColor:'rgba(79,142,247,0.05)'}}>
                        <Text style={{color:'#4F8EF7'}}>‹</Text>
                      </View>
                    </SciFiButton>
                    <Text style={{flex:1,textAlign:'center',fontSize:14,fontWeight:'700',color:th.text}}>{DAYS[focusDate.getDay()]}, {MFULL[focusDate.getMonth()]} {focusDate.getDate()}</Text>
                    <SciFiButton onPress={()=>setFocusDate(addDays(focusDate,1))} color="#4F8EF7">
                      <View style={{padding:8,borderRadius:8,borderWidth:1,borderColor:'rgba(79,142,247,0.3)',backgroundColor:'rgba(79,142,247,0.05)'}}>
                        <Text style={{color:'#4F8EF7'}}>›</Text>
                      </View>
                    </SciFiButton>
                  </View>
                  {tod(focusDate).length===0&&<Text style={{color:th.text3,textAlign:'center',marginTop:30,fontSize:14}}>No tasks — enjoy your day! 🎉</Text>}
                  {tod(focusDate).map(t=>{
                    const c=CATS.find(x=>x.id===t.cat);
                    const p=PRIS.find(x=>x.id===t.pri);
                    return(
                      <AnimCard key={t.id} onPress={()=>setModal({...t})}
                        style={{backgroundColor:th.card,borderLeftWidth:3,borderLeftColor:c?c.color:'#4F8EF7',borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'rgba(79,142,247,0.15)'}}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                          <TouchableOpacity onPress={()=>toggleTask(t.id)} style={{width:22,height:22,borderRadius:11,borderWidth:2,borderColor:t.done?'#34D399':'rgba(79,142,247,0.3)',backgroundColor:t.done?'#34D399':'transparent',marginRight:10,alignItems:'center',justifyContent:'center'}}>
                            {t.done&&<Text style={{color:'#fff',fontSize:11,fontWeight:'800'}}>✓</Text>}
                          </TouchableOpacity>
                          <Text style={{flex:1,fontSize:14,fontWeight:'600',color:th.text,textDecorationLine:t.done?'line-through':'none',opacity:t.done?0.6:1}}>{t.title}</Text>
                          {p&&<View style={{backgroundColor:p.color+'22',borderRadius:5,paddingHorizontal:7,paddingVertical:2}}>
                            <Text style={{fontSize:10,color:p.color,fontWeight:'700'}}>{p.label}</Text>
                          </View>}
                        </View>
                        {t.time&&<Text style={{fontSize:11,color:'#4F8EF7',marginTop:4,marginLeft:32,opacity:.7}}>⏰ {t.time} · {t.dur}min</Text>}
                        {t.notes?<Text style={{fontSize:11,color:th.text3,marginTop:2,marginLeft:32}}>{t.notes}</Text>:null}
                      </AnimCard>
                    );
                  })}
                </View>
              )}

              {view==='week'&&(
                <View>
                  <View style={{flexDirection:'row',alignItems:'center',marginBottom:10}}>
                    <SciFiButton onPress={()=>setFocusDate(addDays(focusDate,-7))} color="#4F8EF7">
                      <View style={{padding:8,borderRadius:8,borderWidth:1,borderColor:'rgba(79,142,247,0.3)',backgroundColor:'rgba(79,142,247,0.05)'}}>
                        <Text style={{color:'#4F8EF7'}}>‹</Text>
                      </View>
                    </SciFiButton>
                    <Text style={{flex:1,textAlign:'center',fontSize:13,fontWeight:'700',color:th.text,letterSpacing:.5}}>THIS WEEK</Text>
                    <SciFiButton onPress={()=>setFocusDate(addDays(focusDate,7))} color="#4F8EF7">
                      <View style={{padding:8,borderRadius:8,borderWidth:1,borderColor:'rgba(79,142,247,0.3)',backgroundColor:'rgba(79,142,247,0.05)'}}>
                        <Text style={{color:'#4F8EF7'}}>›</Text>
                      </View>
                    </SciFiButton>
                  </View>
                  {[...Array(7)].map((_,i)=>{
                    const d=addDays(new Date(focusDate.getFullYear(),focusDate.getMonth(),focusDate.getDate()-focusDate.getDay()),i);
                    const isToday=sameDay(d,TODAY);
                    const ts=tod(d);
                    return(
                      <AnimCard key={i} onPress={()=>{setFocusDate(d);setView('day');}}
                        style={{backgroundColor:isToday?'rgba(79,142,247,0.1)':th.card,borderWidth:1,borderColor:isToday?'rgba(79,142,247,0.4)':'rgba(79,142,247,0.1)',borderRadius:10,padding:10,marginBottom:6,flexDirection:'row',alignItems:'center'}}>
                        <View style={{width:44,alignItems:'center',marginRight:10}}>
                          <Text style={{fontSize:10,fontWeight:'700',color:isToday?'#4F8EF7':th.text3,letterSpacing:1}}>{DAYS[d.getDay()]}</Text>
                          <Text style={{fontSize:20,fontWeight:'800',color:isToday?'#4F8EF7':th.text}}>{d.getDate()}</Text>
                        </View>
                        <View style={{flex:1}}>
                          {ts.length===0&&<Text style={{fontSize:11,color:th.text3}}>No tasks</Text>}
                          {ts.slice(0,3).map(t=>{
                            const c=CATS.find(x=>x.id===t.cat);
                            return<View key={t.id} style={{backgroundColor:c?c.color+'22':th.card2,borderRadius:5,padding:3,marginBottom:2}}>
                              <Text numberOfLines={1} style={{fontSize:11,color:c?c.color:th.text2,fontWeight:'500'}}>{t.time?t.time+' · ':''}{t.title}</Text>
                            </View>;
                          })}
                          {ts.length>3&&<Text style={{fontSize:10,color:th.text3}}>+{ts.length-3} more</Text>}
                        </View>
                      </AnimCard>
                    );
                  })}
                </View>
              )}

              {view==='agenda'&&(
                <View>
                  <Text style={{fontSize:13,fontWeight:'700',color:'#4F8EF7',marginBottom:12,letterSpacing:1}}>// ALL TASKS</Text>
                  {filtered.length===0&&<Text style={{color:th.text3,textAlign:'center',marginTop:30}}>No tasks yet — tap + NEW to add one!</Text>}
                  {filtered.sort((a,b)=>a.date.localeCompare(b.date)).map(t=>{
                    const c=CATS.find(x=>x.id===t.cat);
                    const p=PRIS.find(x=>x.id===t.pri);
                    return(
                      <AnimCard key={t.id} style={{backgroundColor:th.card,borderRadius:10,padding:12,marginBottom:8,borderWidth:1,borderColor:'rgba(79,142,247,0.15)',flexDirection:'row',alignItems:'center'}}>
                        <TouchableOpacity onPress={()=>toggleTask(t.id)} style={{width:22,height:22,borderRadius:11,borderWidth:2,borderColor:t.done?'#34D399':'rgba(79,142,247,0.3)',backgroundColor:t.done?'#34D399':'transparent',marginRight:10,alignItems:'center',justifyContent:'center'}}>
                          {t.done&&<Text style={{color:'#fff',fontSize:11,fontWeight:'800'}}>✓</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={{flex:1}} onPress={()=>setModal({...t})}>
                          <Text style={{fontSize:13,fontWeight:'600',color:th.text,textDecorationLine:t.done?'line-through':'none',opacity:t.done?0.6:1}}>{t.title}</Text>
                          <View style={{flexDirection:'row',gap:5,marginTop:4,flexWrap:'wrap'}}>
                            {c&&<View style={{backgroundColor:c.color+'22',borderRadius:4,paddingHorizontal:6,paddingVertical:1}}><Text style={{fontSize:10,color:c.color,fontWeight:'700'}}>{c.label}</Text></View>}
                            {p&&<View style={{backgroundColor:p.color+'22',borderRadius:4,paddingHorizontal:6,paddingVertical:1}}><Text style={{fontSize:10,color:p.color}}>{p.label}</Text></View>}
                            {t.recur&&t.recur!=='none'&&<View style={{backgroundColor:'rgba(79,142,247,0.1)',borderRadius:4,paddingHorizontal:6,paddingVertical:1}}><Text style={{fontSize:10,color:'#4F8EF7'}}>🔁 {t.recur}</Text></View>}
                          </View>
                          {t.time&&<Text style={{fontSize:11,color:'#4F8EF7',marginTop:2,opacity:.7}}>⏰ {t.time} · {t.dur}min · {t.date}</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=>removeTask(t.id)} style={{padding:6}}>
                          <Text style={{color:th.text3,fontSize:18}}>×</Text>
                        </TouchableOpacity>
                      </AnimCard>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── POMODORO TAB ── */}
          {tab==='pomodoro'&&(
            <View style={{alignItems:'center',paddingTop:10}}>
              <GlitchText text="🍅 Focus Timer" style={{fontSize:20,fontWeight:'800',color:th.text,marginBottom:4,letterSpacing:.5}}/>
              <Text style={{fontSize:13,color:'#4F8EF7',marginBottom:24,letterSpacing:1,opacity:.7}}>// STAY FOCUSED. TAKE BREAKS. REPEAT.</Text>
              <View style={{flexDirection:'row',gap:8,marginBottom:24}}>
                {[{id:'work',label:'FOCUS'},{id:'short',label:'SHORT'},{id:'long',label:'LONG'}].map(p=>(
                  <SciFiButton key={p.id} onPress={()=>{setPomoRunning(false);setPomoPhase(p.id);setPomoSec(POMO_PHASES[p.id]);}} color={POMOCOLOR[p.id]}>
                    <View style={{backgroundColor:pomoPhase===p.id?POMOCOLOR[p.id]+'33':'transparent',borderRadius:20,paddingVertical:7,paddingHorizontal:14,borderWidth:1,borderColor:pomoPhase===p.id?POMOCOLOR[p.id]:'rgba(255,255,255,0.1)'}}>
                      <Text style={{color:pomoPhase===p.id?POMOCOLOR[p.id]:th.text2,fontSize:10,fontWeight:'800',letterSpacing:2}}>{p.label}</Text>
                    </View>
                  </SciFiButton>
                ))}
              </View>
              <View style={{width:200,height:200,alignItems:'center',justifyContent:'center',marginBottom:24}}>
                <View style={{position:'absolute',width:200,height:200,borderRadius:100,borderWidth:1,borderColor:'rgba(79,142,247,0.2)'}}/>
                <View style={{position:'absolute',width:200,height:200,borderRadius:100,borderWidth:3,borderColor:POMOCOLOR[pomoPhase],opacity:pomoPct}}/>
                <View style={{position:'absolute',width:180,height:180,borderRadius:90,borderWidth:1,borderColor:'rgba(79,142,247,0.1)'}}/>
                <GlitchText text={`${pad(pomoMM)}:${pad(pomoSS)}`} style={{fontSize:42,fontWeight:'800',color:th.text,fontFamily:'monospace'}}/>
                <Text style={{fontSize:10,color:POMOCOLOR[pomoPhase],fontWeight:'800',marginTop:4,textTransform:'uppercase',letterSpacing:3}}>
                  {pomoPhase==='work'?'FOCUS':pomoPhase==='short'?'BREAK':'LONG BREAK'}
                </Text>
              </View>
              <View style={{flexDirection:'row',gap:12,marginBottom:20}}>
                <SciFiButton onPress={()=>setPomoRunning(r=>!r)} color={POMOCOLOR[pomoPhase]}>
                  <View style={{backgroundColor:POMOCOLOR[pomoPhase]+'22',borderWidth:1,borderColor:POMOCOLOR[pomoPhase],borderRadius:14,paddingVertical:14,paddingHorizontal:36}}>
                    <Text style={{color:POMOCOLOR[pomoPhase],fontWeight:'800',fontSize:14,letterSpacing:2}}>{pomoRunning?'[ PAUSE ]':'[ START ]'}</Text>
                  </View>
                </SciFiButton>
                <SciFiButton onPress={()=>{setPomoRunning(false);setPomoSec(POMO_PHASES[pomoPhase]);}} color="#555A75">
                  <View style={{backgroundColor:'rgba(255,255,255,0.05)',borderRadius:14,paddingVertical:14,paddingHorizontal:18,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'}}>
                    <Text style={{color:th.text2,fontSize:12,letterSpacing:1}}>RESET</Text>
                  </View>
                </SciFiButton>
              </View>
              <Text style={{fontSize:11,color:th.text3,letterSpacing:1}}>CYCLES_COMPLETED: {pomoCycles}</Text>
              <AnimCard style={{width:'100%',backgroundColor:th.card,borderRadius:14,padding:14,marginTop:20,borderWidth:1,borderColor:'rgba(79,142,247,0.2)'}}>
                <Text style={{fontSize:11,fontWeight:'800',color:'#4F8EF7',marginBottom:10,letterSpacing:1}}>// TODAY_QUEUE</Text>
                {todayTasks.filter(t=>!t.done).length===0&&<Text style={{color:'#34D399',fontSize:12,letterSpacing:1}}>ALL_TASKS_COMPLETE ✓</Text>}
                {todayTasks.filter(t=>!t.done).slice(0,5).map(t=>{
                  const c=CATS.find(x=>x.id===t.cat);
                  return(
                    <View key={t.id} style={{flexDirection:'row',alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderBottomColor:'rgba(79,142,247,0.1)'}}>
                      <TouchableOpacity onPress={()=>toggleTask(t.id)} style={{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:'rgba(79,142,247,0.3)',marginRight:10}}/>
                      <Text style={{flex:1,fontSize:13,color:th.text}}>{t.title}</Text>
                      {c&&<View style={{backgroundColor:c.color+'22',borderRadius:4,paddingHorizontal:6,paddingVertical:1}}>
                        <Text style={{fontSize:10,color:c.color,fontWeight:'700'}}>{c.label}</Text>
                      </View>}
                    </View>
                  );
                })}
              </AnimCard>
            </View>
          )}

          {/* ── HEATMAP TAB ── */}
          {tab==='heatmap'&&(
            <View>
              <GlitchText text="🔥 Task Heatmap" style={{fontSize:20,fontWeight:'800',color:th.text,marginBottom:4}}/>
              <Text style={{fontSize:11,color:'#4F8EF7',marginBottom:16,letterSpacing:1}}>// PRODUCTIVITY_MATRIX :: LAST_6_MONTHS</Text>
              <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12}}>
                <Text style={{fontSize:10,color:th.text3,letterSpacing:1}}>LOW</Text>
                {['rgba(79,142,247,0.1)','#34D39933','#34D39966','#34D399AA','#34D399'].map((c,i)=>(
                  <View key={i} style={{width:14,height:14,borderRadius:3,backgroundColor:c}}/>
                ))}
                <Text style={{fontSize:10,color:th.text3,letterSpacing:1}}>HIGH</Text>
              </View>
              <AnimCard style={{backgroundColor:th.card,borderRadius:14,padding:14,marginBottom:16,borderWidth:1,borderColor:'rgba(79,142,247,0.2)'}}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection:'row',gap:3}}>
                    {[...Array(26)].map((_,wi)=>{
                      const weekStart=addDays(TODAY,-(25-wi)*7);
                      return(
                        <View key={wi} style={{flexDirection:'column',gap:3}}>
                          {[...Array(7)].map((_,di)=>{
                            const d=addDays(weekStart,di);
                            if(d>TODAY)return<View key={di} style={{width:13,height:13}}/>;
                            const data=heatmap[dk(d)];
                            const total=data?.total||0;
                            const done=data?.done||0;
                            let bg='rgba(79,142,247,0.08)';
                            if(total>0){
                              if(done===total)bg=total>=4?'#34D399':`#34D399${['44','77','AA'][Math.min(total-1,2)]}`;
                              else if(done>0)bg='#F59E0B88';
                              else bg='#F43F5E55';
                            }
                            return<View key={di} style={{width:13,height:13,borderRadius:3,backgroundColor:bg}}/>;
                          })}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </AnimCard>
              <View style={{flexDirection:'row',gap:10,marginTop:4}}>
                {[
                  {label:'TOTAL',value:tasks.length,color:'#4F8EF7',emoji:'📋'},
                  {label:'DONE',value:tasks.filter(t=>t.done).length,color:'#34D399',emoji:'✅'},
                  {label:'PENDING',value:tasks.filter(t=>!t.done).length,color:'#F59E0B',emoji:'⏳'},
                  {label:'WEEK',value:tasks.filter(t=>{const d=new Date(t.date+'T00:00:00');return d>=addDays(TODAY,-7)&&d<=TODAY;}).length,color:'#A78BFA',emoji:'📅'},
                ].map(s=>(
                  <AnimCard key={s.label} style={{flex:1,backgroundColor:th.card,borderRadius:12,padding:10,borderWidth:1,borderColor:`${s.color}33`,alignItems:'center'}}>
                    <Text style={{fontSize:16}}>{s.emoji}</Text>
                    <Text style={{fontSize:20,fontWeight:'800',color:s.color,marginTop:4}}>{s.value}</Text>
                    <Text style={{fontSize:9,color:th.text3,marginTop:2,letterSpacing:1}}>{s.label}</Text>
                  </AnimCard>
                ))}
              </View>
              <AnimCard style={{backgroundColor:th.card,borderRadius:14,padding:14,marginTop:12,borderWidth:1,borderColor:'rgba(79,142,247,0.2)'}}>
                <Text style={{fontSize:11,fontWeight:'800',color:'#4F8EF7',marginBottom:12,letterSpacing:1}}>// CATEGORY_BREAKDOWN</Text>
                {CATS.map(c=>{
                  const total=tasks.filter(t=>t.cat===c.id).length;
                  const done=tasks.filter(t=>t.cat===c.id&&t.done).length;
                  const pct=total?Math.round(done/total*100):0;
                  return(
                    <View key={c.id} style={{marginBottom:10}}>
                      <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                        <Text style={{fontSize:12,color:th.text,fontWeight:'600'}}>{c.label}</Text>
                        <Text style={{fontSize:11,color:c.color,fontWeight:'700'}}>{done}/{total} · {pct}%</Text>
                      </View>
                      <View style={{backgroundColor:'rgba(255,255,255,0.05)',borderRadius:4,height:5,overflow:'hidden'}}>
                        <View style={{width:`${pct}%`,height:5,borderRadius:4,backgroundColor:c.color}}/>
                      </View>
                    </View>
                  );
                })}
              </AnimCard>
            </View>
          )}

          {/* ── PROGRESS TAB ── */}
          {tab==='account'&&(
            <View>
              <GlitchText text="📊 Your Progress" style={{fontSize:20,fontWeight:'800',color:th.text,marginBottom:4}}/>
              <Text style={{fontSize:11,color:'#4F8EF7',marginBottom:16,letterSpacing:1}}>// PERFORMANCE_ANALYTICS</Text>
              <AnimCard style={{backgroundColor:th.card,borderRadius:14,padding:16,marginBottom:12,borderWidth:1,borderColor:'rgba(245,158,11,0.3)',alignItems:'center'}}>
                <Text style={{fontSize:36}}>🔥</Text>
                <Text style={{fontSize:32,fontWeight:'800',color:'#F59E0B',marginTop:4,letterSpacing:1}}>{acc.streak}_DAY_STREAK</Text>
                <Text style={{fontSize:12,color:th.text2,marginTop:4,textAlign:'center'}}>{acc.streak===0?'Complete all tasks today to start!':acc.streak>=7?'Incredible consistency!':'Building momentum!'}</Text>
              </AnimCard>
              <View style={{flexDirection:'row',gap:10,marginBottom:12}}>
                {[
                  {label:'TODAY',score:acc.dayScore,color:'#4F8EF7',total:acc.dayTasks.length},
                  {label:'WEEK',score:acc.weekScore,color:'#A78BFA',total:acc.weekTasks.length},
                  {label:'MONTH',score:acc.monthScore,color:'#34D399',total:acc.monthTasks.length},
                ].map(s=>(
                  <AnimCard key={s.label} style={{flex:1,backgroundColor:th.card,borderRadius:12,padding:12,borderWidth:1,borderColor:`${s.color}33`,alignItems:'center'}}>
                    <Text style={{fontSize:9,color:s.color,marginBottom:4,letterSpacing:2,fontWeight:'700'}}>{s.label}</Text>
                    <Text style={{fontSize:24,fontWeight:'800',color:s.score>=70?'#34D399':s.score>=40?'#F59E0B':'#F43F5E'}}>{s.score}%</Text>
                    <View style={{width:'100%',backgroundColor:'rgba(255,255,255,0.05)',borderRadius:3,height:3,marginTop:6}}>
                      <View style={{width:`${s.score}%`,height:3,borderRadius:3,backgroundColor:s.color}}/>
                    </View>
                    <Text style={{fontSize:10,color:th.text3,marginTop:4}}>{s.total} tasks</Text>
                  </AnimCard>
                ))}
              </View>
              {[
                {label:'TODAY',msg:acc.dayMsg,score:acc.dayScore,emoji:'🌅'},
                {label:'THIS WEEK',msg:acc.weekMsg,score:acc.weekScore,emoji:'📅'},
                {label:'THIS MONTH',msg:acc.monthMsg,score:acc.monthScore,emoji:'🗓️'},
              ].map(f=>(
                <AnimCard key={f.label} style={{backgroundColor:th.card,borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:'rgba(79,142,247,0.15)'}}>
                  <View style={{flexDirection:'row',alignItems:'center',marginBottom:8}}>
                    <Text style={{fontSize:18,marginRight:8}}>{f.emoji}</Text>
                    <Text style={{fontSize:11,fontWeight:'800',color:'#4F8EF7',letterSpacing:1}}>{f.label}</Text>
                    <View style={{marginLeft:'auto',backgroundColor:f.score>=70?'#34D39922':f.score>=40?'#F59E0B22':'#F43F5E22',borderRadius:8,paddingHorizontal:8,paddingVertical:3,borderWidth:1,borderColor:f.score>=70?'#34D39944':f.score>=40?'#F59E0B44':'#F43F5E44'}}>
                      <Text style={{fontSize:12,fontWeight:'800',color:f.score>=70?'#34D399':f.score>=40?'#F59E0B':'#F43F5E'}}>{f.score}%</Text>
                    </View>
                  </View>
                  <Text style={{fontSize:13,color:th.text2,lineHeight:20}}>{f.msg}</Text>
                </AnimCard>
              ))}
            </View>
          )}

          {/* ── MUSIC TAB ── */}
          {tab==='spotify'&&(
            <View>
              <GlitchText text="🎵 Focus Music" style={{fontSize:20,fontWeight:'800',color:th.text,marginBottom:4}}/>
              <Text style={{fontSize:11,color:'#4F8EF7',marginBottom:20,letterSpacing:1}}>// AUDIO_ENHANCEMENT_MODULE</Text>
              {CALM_PLAYLISTS.map(p=>(
                <AnimCard key={p.id} onPress={()=>Linking.openURL(p.url)}
                  style={{backgroundColor:th.card,borderRadius:14,padding:16,marginBottom:10,borderWidth:1,borderColor:'rgba(29,185,84,0.2)',flexDirection:'row',alignItems:'center'}}>
                  <View style={{width:48,height:48,borderRadius:12,backgroundColor:'rgba(29,185,84,0.1)',alignItems:'center',justifyContent:'center',marginRight:14,borderWidth:1,borderColor:'rgba(29,185,84,0.3)'}}>
                    <Text style={{fontSize:24}}>{p.emoji}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:14,fontWeight:'700',color:th.text}}>{p.label}</Text>
                    <Text style={{fontSize:11,color:'#1DB954',marginTop:2,letterSpacing:.5}}>// open_spotify →</Text>
                  </View>
                  <View style={{backgroundColor:'rgba(29,185,84,0.15)',borderRadius:20,paddingHorizontal:12,paddingVertical:6,borderWidth:1,borderColor:'#1DB954'}}>
                    <Text style={{color:'#1DB954',fontSize:10,fontWeight:'800',letterSpacing:1}}>PLAY</Text>
                  </View>
                </AnimCard>
              ))}
            </View>
          )}

          {/* ── THEMES TAB ── */}
          {tab==='backdrop'&&(
            <View>
              <GlitchText text="🎨 Choose Theme" style={{fontSize:20,fontWeight:'800',color:th.text,marginBottom:4}}/>
              <Text style={{fontSize:11,color:'#4F8EF7',marginBottom:16,letterSpacing:1}}>// VISUAL_INTERFACE_CONFIG</Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
                {BACKDROPS.map(b=>(
                  <AnimCard key={b.id} onPress={()=>{setBackdrop(b.id);setTab('calendar');closeSidebar();}}
                    style={{width:(width-48)/2,borderRadius:16,overflow:'hidden',borderWidth:2,borderColor:backdrop===b.id?'#4F8EF7':'transparent'}}>
                    <LinearGradient colors={b.colors.length>=2?b.colors:[b.colors[0],b.colors[0]]} style={{padding:20,alignItems:'center',justifyContent:'center',height:90}}>
                      <Text style={{fontSize:28}}>{b.emoji}</Text>
                      <Text style={{fontSize:12,fontWeight:'800',color:'#fff',marginTop:4,letterSpacing:1,textTransform:'uppercase'}}>{b.label}</Text>
                      {backdrop===b.id&&<View style={{position:'absolute',top:8,right:8,backgroundColor:'#4F8EF7',borderRadius:10,width:20,height:20,alignItems:'center',justifyContent:'center'}}>
                        <Text style={{color:'#fff',fontSize:11,fontWeight:'800'}}>✓</Text>
                      </View>}
                    </LinearGradient>
                  </AnimCard>
                ))}
              </View>
            </View>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab==='settings'&&(
            <View>
              <GlitchText text="⚙️ Settings" style={{fontSize:20,fontWeight:'800',color:th.text,marginBottom:4}}/>
              <Text style={{fontSize:11,color:'#4F8EF7',marginBottom:16,letterSpacing:1}}>// SYSTEM_CONFIGURATION</Text>

              {/* About App */}
              <AnimCard style={{backgroundColor:th.card,borderRadius:16,padding:20,marginBottom:14,borderWidth:1,borderColor:'rgba(79,142,247,0.25)'}}>
                <Text style={{fontSize:11,fontWeight:'800',color:'#4F8EF7',letterSpacing:2,marginBottom:14}}>// ABOUT_APP</Text>
                <View style={{alignItems:'center',marginBottom:16}}>
                  <Text style={{fontSize:48,marginBottom:8}}>🐸</Text>
                  <GlitchText text="TADALIST" style={{fontSize:24,fontWeight:'800',color:'#4F8EF7',letterSpacing:4}}/>
                  <Text style={{fontSize:12,color:th.text2,marginTop:4,letterSpacing:1}}>v1.0.0 · Your chaotic productivity companion</Text>
                </View>
                <View style={{backgroundColor:'rgba(79,142,247,0.05)',borderRadius:12,padding:14,borderWidth:1,borderColor:'rgba(79,142,247,0.15)',marginBottom:12}}>
                  <Text style={{fontSize:12,color:th.text2,lineHeight:20}}>
                    Tadalist is a smart, aesthetic productivity app built for students and young professionals who want to get things done — without the boring traditional to-do app vibes. 🚀{'\n\n'}
                    It combines a beautiful calendar, focus timer, habit heatmap, progress analytics, and curated focus music — all in one place.
                  </Text>
                </View>
                <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
                  {['📅 Calendar','🍅 Pomodoro','🔥 Heatmap','📊 Analytics','🎵 Music','🎨 Themes'].map(f=>(
                    <View key={f} style={{backgroundColor:'rgba(79,142,247,0.1)',borderRadius:20,paddingHorizontal:10,paddingVertical:4,borderWidth:1,borderColor:'rgba(79,142,247,0.2)'}}>
                      <Text style={{fontSize:10,color:'#4F8EF7',fontWeight:'600'}}>{f}</Text>
                    </View>
                  ))}
                </View>
              </AnimCard>

              {/* About Founder */}
              <AnimCard style={{backgroundColor:th.card,borderRadius:16,padding:20,marginBottom:14,borderWidth:1,borderColor:'rgba(167,139,250,0.25)'}}>
                <Text style={{fontSize:11,fontWeight:'800',color:'#A78BFA',letterSpacing:2,marginBottom:14}}>// FOUNDER_PROFILE</Text>
                <View style={{flexDirection:'row',alignItems:'center',marginBottom:14}}>
                  <View style={{width:60,height:60,borderRadius:30,backgroundColor:'rgba(167,139,250,0.15)',alignItems:'center',justifyContent:'center',marginRight:14,borderWidth:2,borderColor:'#A78BFA'}}>
                    <Text style={{fontSize:28}}>👨‍💻</Text>
                  </View>
                  <View>
                    <Text style={{fontSize:18,fontWeight:'800',color:th.text}}>Jatin Kumar</Text>
                    <Text style={{fontSize:12,color:'#A78BFA',marginTop:2,letterSpacing:.5}}>Founder & Developer</Text>
                    <View style={{backgroundColor:'rgba(167,139,250,0.15)',borderRadius:6,paddingHorizontal:8,paddingVertical:2,marginTop:4,alignSelf:'flex-start',borderWidth:1,borderColor:'rgba(167,139,250,0.3)'}}>
                      <Text style={{fontSize:10,color:'#A78BFA',fontWeight:'700',letterSpacing:1}}>1ST YEAR · COLLEGE</Text>
                    </View>
                  </View>
                </View>
                <View style={{backgroundColor:'rgba(167,139,250,0.05)',borderRadius:12,padding:14,borderWidth:1,borderColor:'rgba(167,139,250,0.15)',marginBottom:12}}>
                  <Text style={{fontSize:12,color:th.text2,lineHeight:22}}>
                    Hey! I'm Jatin, a first year college student with a passion for building cool things. 🚀{'\n\n'}
                    I built Tadalist because I was tired of boring productivity apps that didn't match my vibe. I wanted something that looked like it belonged in 2025 — aesthetic, fast, and actually fun to use.{'\n\n'}
                    This app was built from scratch with zero prior experience in app development. Every bug, every feature, every pixel — it's all me. 💪{'\n\n'}
                    If you love Tadalist, share it with your friends. It genuinely means the world to me! 🐸
                  </Text>
                </View>
                <View style={{flexDirection:'row',gap:8}}>
                  {['🎓 Student','💻 Developer','🐸 Frog Fan','🚀 Builder'].map(t=>(
                    <View key={t} style={{backgroundColor:'rgba(167,139,250,0.1)',borderRadius:20,paddingHorizontal:10,paddingVertical:4,borderWidth:1,borderColor:'rgba(167,139,250,0.2)'}}>
                      <Text style={{fontSize:10,color:'#A78BFA',fontWeight:'600'}}>{t}</Text>
                    </View>
                  ))}
                </View>
              </AnimCard>

              {/* App Stats */}
              <AnimCard style={{backgroundColor:th.card,borderRadius:16,padding:20,marginBottom:14,borderWidth:1,borderColor:'rgba(52,211,153,0.25)'}}>
                <Text style={{fontSize:11,fontWeight:'800',color:'#34D399',letterSpacing:2,marginBottom:14}}>// YOUR_STATS</Text>
                <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
                  {[
                    {label:'Total Tasks',value:tasks.length,color:'#4F8EF7'},
                    {label:'Completed',value:tasks.filter(t=>t.done).length,color:'#34D399'},
                    {label:'Streak',value:`${acc.streak}d`,color:'#F59E0B'},
                    {label:'Score',value:`${score}%`,color:'#A78BFA'},
                  ].map(s=>(
                    <View key={s.label} style={{width:'47%',backgroundColor:`${s.color}11`,borderRadius:12,padding:12,borderWidth:1,borderColor:`${s.color}33`,alignItems:'center'}}>
                      <Text style={{fontSize:22,fontWeight:'800',color:s.color}}>{s.value}</Text>
                      <Text style={{fontSize:10,color:th.text3,marginTop:2,letterSpacing:.5}}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </AnimCard>

              {/* Sign out */}
              <SciFiButton onPress={()=>signOut(auth)} color="#F43F5E">
                <View style={{backgroundColor:'rgba(244,63,94,0.1)',borderWidth:1,borderColor:'rgba(244,63,94,0.4)',borderRadius:12,padding:14,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8}}>
                  <Text style={{fontSize:16}}>🚪</Text>
                  <Text style={{color:'#F43F5E',fontWeight:'800',fontSize:14,letterSpacing:1}}>SIGN_OUT()</Text>
                </View>
              </SciFiButton>
            </View>
          )}

        </ScrollView>

        {/* SIDEBAR OVERLAY */}
        {sidebarOpen&&(
          <Animated.View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.7)',zIndex:50,opacity:overlayAnim}}>
            <TouchableOpacity style={{flex:1}} onPress={closeSidebar}/>
          </Animated.View>
        )}

        {/* SIDEBAR */}
        <Animated.View style={{position:'absolute',left:0,top:0,bottom:0,width:270,zIndex:100,transform:[{translateX:sidebarAnim}]}}>
          <LinearGradient colors={['#080B12','#0F1525','#080B12']} style={{flex:1,borderRightWidth:1,borderRightColor:'rgba(79,142,247,0.2)'}}>
            <View style={{paddingTop:54,paddingHorizontal:20,paddingBottom:20,borderBottomWidth:1,borderBottomColor:'rgba(79,142,247,0.1)'}}>
              <View style={{width:60,height:60,borderRadius:30,backgroundColor:'rgba(79,142,247,0.1)',alignItems:'center',justifyContent:'center',marginBottom:12,borderWidth:2,borderColor:'rgba(79,142,247,0.4)'}}>
                <Text style={{fontSize:28}}>🐸</Text>
              </View>
              <GlitchText text="TADALIST" style={{fontSize:16,fontWeight:'800',color:'#4F8EF7',letterSpacing:3}}/>
              <Text style={{fontSize:10,color:'#555A75',marginTop:3,letterSpacing:1}} numberOfLines={1}>{user?.email}</Text>
              <View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:6}}>
                <View style={{width:6,height:6,borderRadius:3,backgroundColor:'#34D399'}}/>
                <Text style={{fontSize:9,color:'#34D399',letterSpacing:1}}>SYSTEM_ONLINE</Text>
              </View>
            </View>
            <ScrollView style={{flex:1,paddingTop:8}} showsVerticalScrollIndicator={false}>
              {SIDEBAR_ITEMS.map(item=>{
                const isActive=tab===item.id;
                return(
                  <TouchableOpacity key={item.id} onPress={()=>{setTab(item.id);closeSidebar();}}
                    style={{flexDirection:'row',alignItems:'center',paddingVertical:14,paddingHorizontal:20,marginHorizontal:8,marginVertical:2,borderRadius:12,backgroundColor:isActive?'rgba(79,142,247,0.12)':'transparent',borderWidth:isActive?1:0,borderColor:'rgba(79,142,247,0.25)'}}>
                    <View style={{width:36,height:36,borderRadius:10,backgroundColor:isActive?'rgba(79,142,247,0.15)':'rgba(255,255,255,0.03)',alignItems:'center',justifyContent:'center',marginRight:14,borderWidth:1,borderColor:isActive?'rgba(79,142,247,0.3)':'rgba(255,255,255,0.05)'}}>
                      <Text style={{fontSize:18}}>{item.emoji}</Text>
                    </View>
                    <Text style={{fontSize:13,fontWeight:isActive?'800':'500',color:isActive?'#4F8EF7':'#8B8FA8',letterSpacing:isActive?.5:0}}>{item.label}</Text>
                    {isActive&&<View style={{marginLeft:'auto',width:6,height:6,borderRadius:3,backgroundColor:'#4F8EF7'}}/>}
                  </TouchableOpacity>
                );
              })}
              <View style={{height:1,backgroundColor:'rgba(79,142,247,0.1)',marginHorizontal:20,marginVertical:12}}/>
              <TouchableOpacity onPress={()=>{signOut(auth);closeSidebar();}}
                style={{flexDirection:'row',alignItems:'center',paddingVertical:14,paddingHorizontal:20,marginHorizontal:8,borderRadius:12,marginBottom:20}}>
                <View style={{width:36,height:36,borderRadius:10,backgroundColor:'rgba(244,63,94,0.08)',alignItems:'center',justifyContent:'center',marginRight:14,borderWidth:1,borderColor:'rgba(244,63,94,0.2)'}}>
                  <Text style={{fontSize:18}}>🚪</Text>
                </View>
                <Text style={{fontSize:13,fontWeight:'600',color:'#F43F5E',letterSpacing:.5}}>Sign Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </Animated.View>

        {/* TASK MODAL */}
        <Modal visible={!!modal} animationType="slide" transparent onRequestClose={()=>setModal(null)}>
          <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'}}>
            <View style={{backgroundColor:th.isDark?'#0F1525':'#FFFFFF',borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'90%',borderTopWidth:1,borderTopColor:'rgba(79,142,247,0.3)'}}>
              <ScrollView>
                <View style={{flexDirection:'row',alignItems:'center',marginBottom:16}}>
                  <Text style={{fontSize:14,fontWeight:'800',color:'#4F8EF7',letterSpacing:1}}>{modal?.id?'// EDIT_TASK':'// NEW_TASK'}</Text>
                  <TouchableOpacity onPress={()=>setModal(null)} style={{marginLeft:'auto',padding:4}}>
                    <Text style={{fontSize:24,color:th.text3}}>×</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{fontSize:10,color:'#4F8EF7',marginBottom:4,letterSpacing:1}}>TITLE *</Text>
                <TextInput value={modal?.title||''} onChangeText={v=>setModal(m=>({...m,title:v}))}
                  placeholder="task.title…" placeholderTextColor={th.text3}
                  style={{backgroundColor:'rgba(79,142,247,0.05)',borderWidth:1,borderColor:'rgba(79,142,247,0.2)',borderRadius:10,padding:12,color:th.text,fontSize:13,marginBottom:12}}/>
                <View style={{flexDirection:'row',gap:10,marginBottom:12}}>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:10,color:'#4F8EF7',marginBottom:4,letterSpacing:1}}>DATE</Text>
                    <TextInput value={modal?.date||''} onChangeText={v=>setModal(m=>({...m,date:v}))}
                      placeholder="YYYY-MM-DD" placeholderTextColor={th.text3}
                      style={{backgroundColor:'rgba(79,142,247,0.05)',borderWidth:1,borderColor:'rgba(79,142,247,0.2)',borderRadius:10,padding:12,color:th.text,fontSize:13}}/>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:10,color:'#4F8EF7',marginBottom:4,letterSpacing:1}}>TIME</Text>
                    <TextInput value={modal?.time||''} onChangeText={v=>setModal(m=>({...m,time:v}))}
                      placeholder="09:00" placeholderTextColor={th.text3}
                      style={{backgroundColor:'rgba(79,142,247,0.05)',borderWidth:1,borderColor:'rgba(79,142,247,0.2)',borderRadius:10,padding:12,color:th.text,fontSize:13}}/>
                  </View>
                </View>
                <Text style={{fontSize:10,color:'#4F8EF7',marginBottom:6,letterSpacing:1}}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
                  <View style={{flexDirection:'row',gap:6}}>
                    {CATS.map(c=>(
                      <SciFiButton key={c.id} onPress={()=>setModal(m=>({...m,cat:c.id}))} color={c.color}>
                        <View style={{backgroundColor:modal?.cat===c.id?c.color+'33':'transparent',borderWidth:1.5,borderColor:modal?.cat===c.id?c.color:'rgba(255,255,255,0.1)',borderRadius:8,paddingVertical:6,paddingHorizontal:12}}>
                          <Text style={{color:modal?.cat===c.id?c.color:th.text2,fontSize:11,fontWeight:'700'}}>{c.label}</Text>
                        </View>
                      </SciFiButton>
                    ))}
                  </View>
                </ScrollView>
                <Text style={{fontSize:10,color:'#4F8EF7',marginBottom:6,letterSpacing:1}}>PRIORITY</Text>
                <View style={{flexDirection:'row',gap:6,marginBottom:12}}>
                  {PRIS.map(p=>(
                    <SciFiButton key={p.id} onPress={()=>setModal(m=>({...m,pri:p.id}))} color={p.color}>
                      <View style={{backgroundColor:modal?.pri===p.id?p.color+'33':'transparent',borderWidth:1.5,borderColor:modal?.pri===p.id?p.color:'rgba(255,255,255,0.1)',borderRadius:8,paddingVertical:6,paddingHorizontal:12}}>
                        <Text style={{color:modal?.pri===p.id?p.color:th.text2,fontSize:11,fontWeight:'700'}}>{p.label}</Text>
                      </View>
                    </SciFiButton>
                  ))}
                </View>
                <Text style={{fontSize:10,color:'#4F8EF7',marginBottom:4,letterSpacing:1}}>NOTES</Text>
                <TextInput value={modal?.notes||''} onChangeText={v=>setModal(m=>({...m,notes:v}))}
                  placeholder="// add notes…" placeholderTextColor={th.text3} multiline numberOfLines={3}
                  style={{backgroundColor:'rgba(79,142,247,0.05)',borderWidth:1,borderColor:'rgba(79,142,247,0.2)',borderRadius:10,padding:12,color:th.text,fontSize:13,marginBottom:16,textAlignVertical:'top'}}/>
                <SciFiButton onPress={()=>saveModal(modal)} color="#4F8EF7">
                  <View style={{backgroundColor:modal?.title?'rgba(79,142,247,0.15)':'rgba(255,255,255,0.03)',borderWidth:1,borderColor:modal?.title?'#4F8EF7':'rgba(255,255,255,0.1)',borderRadius:12,padding:14,alignItems:'center',marginBottom:8,opacity:modal?.title?1:0.5}}>
                    <Text style={{color:'#4F8EF7',fontWeight:'800',fontSize:14,letterSpacing:1}}>{modal?.id?'[ SAVE CHANGES ]':'[ CREATE TASK ]'}</Text>
                  </View>
                </SciFiButton>
                {modal?.id&&(
                  <SciFiButton onPress={()=>{removeTask(modal.id);setModal(null);}} color="#F43F5E">
                    <View style={{backgroundColor:'rgba(244,63,94,0.1)',borderRadius:12,padding:14,alignItems:'center',borderWidth:1,borderColor:'rgba(244,63,94,0.3)'}}>
                      <Text style={{color:'#F43F5E',fontWeight:'700',fontSize:13,letterSpacing:1}}>[ DELETE ]</Text>
                    </View>
                  </SciFiButton>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}
