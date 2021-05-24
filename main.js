	var tokens;
	
	var TT_NUMBER = 1;
	var TT_VARIABLE = 2;
	var TT_SUFFIX = 3;
	var TT_OPERATOR = 4;
	var TT_GROUP = 5;
	
	/*
	 Special Operator and Function Symbols
		• Operators (with numbers at left and right):
	 		c - combination
			p - permutation
			m - modulo
			n - scientific notation
		
		• Variables (as constant numbers)
			d - pi
			e - euler's number
		
		• Suffix (with numbers at left)
			h - percent
			f - factorial
			
		• Functions (as manipulative groups)
			a - absolute
			
			l - log 10
			g - ln
			
			s - sin
			o - cosine
			t - tangent
			u - secant
			v - cosecant
			w - cotangent
			x - arcsine
			y - arccosine
			z - arctangent
			
			r - root 2
			q - root 3
			
			


	 */
	 
	
	
	var lst_num = "0123456789.";
	var lst_operator = "+-*/^cpmn";
	var lst_variable = "de";
	var lst_suffix = "hf";
	var lst_group1 = "(algsotuvwxyzrq";
	var lst_group2 = ")";
	
	function getTokenType(c) {
		var res = -1;
		
		if(lst_num.indexOf(c)!=-1) res = TT_NUMBER;
			else if(lst_operator.indexOf(c)!=-1) res = TT_OPERATOR;
			else if(lst_variable.indexOf(c)!=-1) res = TT_VARIABLE;
			else if(lst_suffix.indexOf(c)!=-1) res = TT_SUFFIX;
			else if(lst_group1.indexOf(c)!=-1) res = TT_GROUP + 0.1;
			else if(lst_group2.indexOf(c)!=-1) res = TT_GROUP + 0.2;
		return res;
	}
	
	function tokenize(fs) {
		var tok = [];
		var groups_lst = [];
		
		var ctt = -1;
		var g = true;
		var ct = "";
		
		//console.log("Prefield: " + fs);
		
		for(var i=0; i<fs.length; i++) {
			var t = fs.charAt(i);
			var tt = getTokenType(t);
			
			switch(Math.floor(tt)) {
				case TT_GROUP:
					if(ctt == TT_NUMBER) add(tok, groups_lst, TT_NUMBER, ct);
					
					if(tt==TT_GROUP+0.1) {
						groups_lst.push([TT_GROUP, [], t]);
						
						g = true;
					
					} else if(tt==TT_GROUP+0.2) {
						push(tok, groups_lst);
						g = false;
					}
					
					ctt = -1;
					ct = "";
				break;
				case TT_NUMBER:
					if(ctt==TT_NUMBER) {
						ct += t;
					} else {
						ctt = TT_NUMBER;
						ct = t + "";
					}
					
					g = false;
				break;
				case TT_OPERATOR:
					if(ctt==TT_NUMBER) add(tok, groups_lst, TT_NUMBER, ct); else if(ctt==-1) {
						if(t=="-" && g) add(tok, groups_lst, TT_NUMBER, "0");
					}
					
					ctt = TT_OPERATOR;
					add(tok, groups_lst, TT_OPERATOR, t);
					
					g = false;
				break;
				case TT_VARIABLE:
					if(ctt==TT_NUMBER) add(tok, groups_lst, TT_NUMBER, ct);
					
					ctt = -1;
					add(tok, groups_lst, TT_VARIABLE, t);
					
					g = false;
				break;
				case TT_SUFFIX:
					if(ctt==TT_NUMBER) add(tok, groups_lst, TT_NUMBER, ct);

					ctt = -1;
					add(tok, groups_lst, TT_SUFFIX, t);

					g = false;
				break;
			}
		}
		
		while(groups_lst.length>0) push(tok, groups_lst);
		
		return tok;
		
	}
	
	function add(toks0, groups0, tt0, t0) {
		var ti = [tt0, t0];
		
		if(groups0.length>0) {
			var li = groups0.length-1;
			
			groups0[li][1].push(ti);
		} else {
			toks0.push(ti);
		}
	}
	
	function push(toks, groups) {
		if(groups.length>0) {
			var li = groups.length-1;

			if(groups.length>1) {
				groups[li-1][1].push(groups.pop());

			} else if(groups.length==1) {
				toks.push(groups.pop());
			}
		}
	}
	
	function evaluate(group, pid, gt) {
		var ans = [];
		ans[0] = AnsType_Number;
		ans[1] = 0;
		
		var isDone = false;
		var curval = 0;
		
		for(var i=0; i<group.length && !isDone;) {
			if(i==0) {
				var ci = group[i];
				var ctt = ci[0];
				
				if(ctt==TT_NUMBER) curval = Number(ci[1]);
				else if(ctt==TT_VARIABLE) curval = getVariable(ci[1]);
				else if(ctt==TT_GROUP) {
					var ca = evaluate(ci[1], pid + "-" + i, ci[2]);
					
					if(ca[0] == AnsType_Number) curval = ca[1];
					else {
						isDone = true;
						ans = ca;
					}
				} else {
					isDone = true;
					ans[0] = AnsType_Error;
					ans[1] = "Numbers should go first";
					ans[2] = pid + "-" + i;
				}
			}
			
			if(!isDone) {
			if(i+1<group.length) {
				var c2 = group[i+1];
				
				if(c2[0]==TT_SUFFIX) {
					curval = operateS(curval, c2[1]);
					
					i++;
				} else if(c2[0]==TT_OPERATOR) {
					var op = c2[1];
					var n2 = 0;
					
					if(i+2<group.length) {
						var c3 = group[i+2];
						
						var isSolveable = true;
						
						switch(c3[0]) {
							case TT_NUMBER:
								n2 = Number(c3[1]);
							break;
							case TT_VARIABLE:
								n2 = getVariable(c3[1]);
							break;
							case TT_GROUP:
								var ca = evaluate(c3[1], pid+"-"+i, c3[2]);
								if(ca[0]==AnsType_Number) {
									n2 = ca[1];
								} else {
									isSolveable = false;
									ans = ca;
								}
							break;
						}
						
						if(isSolveable) {
							curval = operate(curval, op, n2);
							i+=2;
						} else {
							isDone = true;
						}
					} else {
						isDone = true;
						ans[0] = AnsType_Number;
						ans[1] = curval;
					}
				}
				
				/*
				Object[] c3 = group.get(i+2);
				
				double n1 = curval;
				String op;
				double n2;
				
				if(((int)c2[0])==TT_OPERATOR && ((int)c3[0])==TT_NUMBER) {
					op = (String) c2[1];
					
					n2 = Double.parseDouble((String) c3[1]);
					
					curval = operate(n1, op, n2);
					i+=2;
				} else if(((int)c2[0])==TT_OPERATOR && ((int)c3[0])==TT_GROUP) {
					op = (String) c2[1];
					
					Object[] ca = evaluate((ArrayList<Object[]>) c3[1], pid + "-" + i);

					if((int)ca[0] == AnsType_Number) {
						n2 = (double) ca[1];
						
						curval = operate(n1, op, n2);
						i+=2;
					} else {
						isDone = true;
						ans = ca;
					}
				} else {
					isDone = true;
					ans[0] = AnsType_Error;
					ans[1] = "Should be separated with operators";
					ans[2] = pid + "-" + i;
					
					log("Error found: " + ans[1] + "\n\t at " + ans[2] +
						"\n\t Output-> o2t = " + ((int)c2[0]) + "; o3t = " + ((int)c3[0]) +
						"\n\t Current Value-> " + curval);
				}*/
			} else {
				isDone = true;
				ans[0] = AnsType_Number;
				ans[1] = curval;
			}
			}
		}
		
		if(ans[0]==AnsType_Number) {
			var pre = ans[1];
			var fin = pre;
		
			if(gt!=null) {
				switch(gt) {
					case "a":
						fin = Math.abs(pre);
						break;
					case "l":
						fin = Math.log10(pre);
						break;
					case "g":
						fin = Math.log10(pre)/Math.log10(Math.E);
						break;
						
					case "r":
						fin = Math.sqrt(pre);
						break;
					case "q":
						fin = Math.cbrt(pre);
						break;
						
					case "s":
						fin = Math.sin(toRadians(pre));
						break;
					case "o":
						fin = Math.cos(toRadians(pre));
						break;
					case "t":
						fin = Math.tan(toRadians(pre));
						break;
					case "u":
						fin = 1/Math.cos(toRadians(pre));
						break;
					case "v":
						fin = 1/Math.sin(toRadians(pre));
						break;
					case "w":
						fin = 1/Math.tan(toRadians(pre));
						break;
					case "x":
						fin = Math.asin(toRadians(pre));
						break;
					case "y":
						fin = Math.acos(toRadians(pre));
						break;
					case "z":
						fin = Math.atan(toRadians(pre));
						break;
				}
			}
			ans[1] = fin;
		}
		return ans;
	}
	
	function operate(n1, op, n2) {
		var res = 0;
		switch(op) {
			case "+":
				res = n1 + n2;
			break;
			case "-":
				res = n1 - n2;
			break;
			case "*":
				res = n1 * n2;
			break;
			case "/":
				res = n1 / n2;
			break;
			case "^":
				res = Math.pow(n1, n2);
			break;
			case "p":
				res = operateS(n1, "f") / operateS(n1-n2, "f");
			break;
			case "c":
				res = operate(n1, "p", n2) / operateS(n2, "f");
			break;
			case "n":
				res = n1*Math.pow(10, n2);
			break;
			case "m":
				res = n1 - (n2*Math.floor(n1/n2));
			break;
			
		}
		return res;
	}
	
	function getVariable(v) {
		var res = 0;
		switch(v) {
			case "d":
				res = Math.PI;
			break;
			case "e":
				 res = Math.E;
			break;
		}
		
		return res;
	}
	
	function operateS(n, s) {
		var res = n;
		switch(s) {
			case "h":
				res = n / 100;
			break;
			case "f":
				var res2 = 1;
				for(var ri=Math.floor(n); ri>0; ri--) {
					res2*=ri;
				}
				
				res = res2;
			break;
		}
		
		return res;
	}
	
	
	var AnsType_Error = 0;
	var AnsType_Number = 1;
	
	function preview(parent, group) {
		//console.clear();
		for(var i=0; i<group.length; i++) {
			
			var rt = "";
			for(var t=0; t<parent-1; t++) rt += "\t";
			if(parent>0) rt += "|---";
			
			var gi = group[i];
			var gitt = gi[0];
	
			
			switch(gitt) {
				case TT_GROUP:
					rt += "GROUP";
					log(rt);
					
					new preview(parent+1, gi[1]);
				break;
				case TT_NUMBER:
					rt += "NUMBER: \t" + gi[1];
					log(rt);
				break;
				case TT_OPERATOR:
					rt += "OPERATOR: \t" + gi[1];
					log(rt);
				break;
				case TT_SUFFIX:
					rt += "SUFFIX: \t" + gi[1];
					log(rt);
				break;
				case TT_VARIABLE:
					rt += "VARIABLE: \t" + gi[1];
					log(rt);
				break;
			}
			
			//log(rt);
		}
	}
	
	function log(s) {
		console.log(s);
	}
