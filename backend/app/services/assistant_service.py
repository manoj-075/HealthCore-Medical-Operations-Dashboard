"""Safe conversational orchestration. User text is never executed as SQL."""
import os
import re
import math
import urllib.parse
import urllib.request
from app.services import analytics_service

def money(value):
    value = float(value or 0)
    return f"₹{value / 10_000_000:.2f} Cr" if value >= 10_000_000 else (f"₹{value / 100_000:.2f} L" if value >= 100_000 else f"₹{value:,.2f}")

def suggestions(kind):
    return {"department": ["Compare it with another department", "What is its revenue?"], "operations": ["How can we improve bed utilization?", "Which resources are most utilized?"], "finance": ["Which department has the highest revenue?", "What is outstanding balance?"], "geography": ["Which state has the highest demand?", "Compare the top cities"], "recommendation": ["Would you like a department comparison?", "Show the relevant operational metric"]}.get(kind, ["Show an operational summary", "What can HealthCore help me analyze?"])

def nearby(latitude, longitude):
    if latitude is None or longitude is None: return None
    query = f"[out:json][timeout:12];(node[amenity=hospital](around:5000,{latitude},{longitude});way[amenity=hospital](around:5000,{latitude},{longitude}););out center 8;"
    try:
        data = urllib.parse.urlencode({"data": query}).encode()
        req = urllib.request.Request("https://overpass-api.de/api/interpreter", data=data, headers={"User-Agent": "HealthCoreDashboard/1.0"})
        with urllib.request.urlopen(req, timeout=15) as response: payload = __import__("json").loads(response.read().decode())
        places = []
        for item in payload.get("elements", []):
            lat = item.get("lat", item.get("center", {}).get("lat")); lon = item.get("lon", item.get("center", {}).get("lon"))
            tags = item.get("tags", {}); name = tags.get("name")
            if lat is None or lon is None or not name: continue
            distance = 2 * 6371 * math.asin(math.sqrt(math.sin(math.radians(lat - latitude) / 2) ** 2 + math.cos(math.radians(latitude)) * math.cos(math.radians(lat)) * math.sin(math.radians(lon - longitude) / 2) ** 2))
            area = ", ".join(filter(None, [tags.get("addr:suburb"), tags.get("addr:city"), tags.get("addr:state")]))
            places.append({"name": name, "latitude": lat, "longitude": lon, "area": area or None, "distance_km": round(distance, 1)})
        places.sort(key=lambda place: place["distance_km"]); places = places[:5]
        answer = "Nearby hospitals from OpenStreetMap: " + ", ".join(place["name"] for place in places) + "." if places else "I could not find named hospitals within 5 km of the supplied location."
        return answer, places
    except Exception: return "I could not reach the nearby-hospital search right now. Please try again or use a local maps service.", []

def local_answer(db, query, history, latitude=None, longitude=None):
    q = query.lower().strip()
    previous = " ".join(str(x.get("content", "")) for x in history[-3:]).lower()
    if any(x in q for x in ("near me", "nearby", "nearest hospital")):
        return "I can show real nearby hospitals on the HealthCore map if you allow approximate location access. I do not use HealthCore patient-demand data as hospital locations.", "nearby", []
    if re.fullmatch(r"(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|help|help me|what can you do)[!.? ]*", q):
        return "Hello — I can analyze HealthCore patients, admissions, departments, staff, beds, resources, billing, trends, demographics, and geographic demand. I can also explain operational healthcare terms and turn dashboard facts into practical recommendations.", "conversation", suggestions("default")
    if any(x in q for x in ("treatment", "diagnose", "medication", "dose", "prescription", "symptoms")):
        return "I can help with operational analytics, but I cannot provide diagnosis, treatment, or medication advice. For clinical concerns, please consult a qualified clinician.", "safety_notice", []

    overview = analytics_service.get_overview(db)
    departments = analytics_service.get_department_performance(db)
    revenue = analytics_service.get_revenue_by_department(db)
    operations = analytics_service.get_operations_summary(db)
    geography = analytics_service.get_geographic_analysis(db)
    top = departments[0] if departments else None
    city = geography.get("by_city", [None])[0]
    state = geography.get("by_state", [None])[0]
    revenue_map = {x["department"].lower(): x for x in revenue}
    mentioned = next((x for x in departments if re.search(r"\b" + re.escape(x["department"].lower()) + r"\b", q)), None)
    if any(x in q for x in ("compare", "top two", "top 2")) and len(departments) >= 2:
        first, second = departments[:2]
        return f"The top two departments by admissions are {first['department']} ({first['admissions']:,}) and {second['department']} ({second['admissions']:,}).", "department", suggestions("department")
    if (q in {"why", "why?", "tell me more"} or q.startswith("why ")) and top and ("department" in previous or "demand" in previous):
        return f"{top['department']} leads the current demand ranking because it has the most recorded admissions ({top['admissions']:,}). The dashboard establishes volume, but lacks causal fields such as acuity, referral source, or capacity, so it cannot prove why volume is highest.", "department", suggestions("department")
    if mentioned:
        bill = revenue_map.get(mentioned["department"].lower(), {})
        return f"{mentioned['department']} has {mentioned['admissions']:,} admissions and {money(bill.get('total_revenue'))} billed revenue in the current HealthCore data.", "department", suggestions("department")
    if (("department" in q and any(x in q for x in ("highest", "top", "demand", "busiest"))) or any(x in q for x in ("highest admissions", "most admissions", "busiest department"))) and top:
        return f"{top['department']} has the highest current admission demand with {top['admissions']:,} admissions.", "department", suggestions("department")
    if any(x in q for x in ("doctor", "physician")):
        return f"HealthCore records {operations['total_doctors']:,} doctors. The current analytics do not expose individual doctor names or schedules, but can be narrowed by department.", "operations", suggestions("operations")
    if any(x in q for x in ("staff", "shift", "workforce")):
        return f"The dashboard records {operations['total_staff']:,} staff members. Staff and shift distributions are available in Operational Intelligence; ask for a department or shift to focus the discussion.", "operations", suggestions("operations")
    if any(x in q for x in ("bed", "occupancy", "utilization")):
        return f"Bed utilization is the share of beds currently occupied. HealthCore shows {overview['bed_occupancy_rate']}% occupancy: {overview['occupied_beds']:,} occupied and {overview['available_beds']:,} available beds.", "operations", suggestions("operations")
    if any(x in q for x in ("resource", "equipment")):
        return f"Resource utilization is {operations['resource_utilization']}% across the recorded inventory. Operational Intelligence can break availability down by department and resource type.", "operations", suggestions("operations")
    if any(x in q for x in ("revenue", "billing", "bill", "collection", "outstanding", "payment")):
        return f"HealthCore has {money(overview['total_revenue'])} billed, {money(overview['total_collected'])} collected, and {money(overview['outstanding_balance'])} outstanding (collection rate {overview['collection_rate']}%).", "finance", suggestions("finance")
    if any(x in q for x in ("top cities", "top 3 cities", "top 5 cities", "highest cities")):
        limit = 5 if "5" in q else 3
        cities = geography.get("by_city", [])[:limit]
        return "Top cities by patient volume: " + ", ".join(f"{item['city']} ({item['count']:,})" for item in cities) + ".", "geography", suggestions("geography")
    if any(x in q for x in ("city", "state", "geographic", "location", "demand")) and city:
        return f"{city['city']} has the highest recorded patient volume ({city['count']:,}); {state['state']} is the leading state ({state['count']:,}).", "geography", suggestions("geography")
    if any(x in q for x in ("long stay", "length of stay", "los", "readmission")):
        if "readmission" in q: return "Readmission means a patient returns after discharge within a defined period. HealthCore has admission episodes but no configured readmission-window metric, so I cannot calculate a reliable rate from the current data.", "limitation", []
        return f"HealthCore has {overview['long_stay_patients']:,} admissions exceeding seven days, with an average recorded length of stay of {overview['avg_length_of_stay']} days.", "patient", suggestions("recommendation")
    if any(x in q for x in ("patient", "admission", "demographic", "age", "gender")):
        summary = analytics_service.get_patient_summary(db)
        return f"HealthCore contains {overview['total_patients']:,} registered patients and {overview['total_admissions']:,} admissions. The average patient age is {summary['avg_age']} years.", "patient", suggestions("department")
    if any(x in q for x in ("improve", "reduce", "should we", "what should", "prioritize", "recommend")):
        name = top['department'] if top else "the highest-volume department"
        return f"Based on current data, prioritize review of {overview['long_stay_patients']:,} long-stay admissions and {money(overview['outstanding_balance'])} outstanding billing. Review {name} first because it has the largest admission load. These are operational priorities, not proof of root cause; pair them with staffing, acuity, and discharge-process review.", "recommendation", suggestions("recommendation")
    if "icu" in q: return "ICU means Intensive Care Unit: a specialized area for patients needing close monitoring and advanced life support. It differs from general wards through higher-acuity staffing, equipment, and monitoring requirements.", "general", suggestions("operations")
    if "healthcare analytics" in q: return "Healthcare analytics is the use of clinical, operational, and financial data to identify patterns and support decisions. In HealthCore, it includes patient demand, admissions, bed utilization, staffing, resources, billing, and geographic trends.", "general", suggestions("default")
    return "I don’t have enough evidence in the current HealthCore data to answer that precisely. I can analyze patients, admissions, departments, staff, beds, resources, billing, trends, demographics, long stays, and geographic demand—or explain an operations term.", "limitation", suggestions("default")

def model_answer(query, history, fact_answer):
    """Optional prose layer: it receives facts only, never SQL or a DB session."""
    if not os.getenv("OPENAI_API_KEY"): return None
    try:
        from openai import OpenAI
        transcript = "\n".join(f"{m.get('role', 'user')}: {m.get('content', '')}" for m in history[-6:])
        response = OpenAI().responses.create(model=os.getenv("OPENAI_MODEL", "gpt-5-mini"), instructions="You are HealthCore's concise operations assistant. Use only supplied verified HealthCore facts for numbers. Never invent facts, execute SQL, claim database access, or give clinical advice. Clearly distinguish general education from dashboard facts.", input=f"Conversation:\n{transcript}\nUser: {query}\nVerified context: {fact_answer}\nAnswer in at most 130 words.")
        return response.output_text.strip() or None
    except Exception: return None

def process_assistant_query(db, query, department_id=None, threshold_days=7, history=None, latitude=None, longitude=None):
    if any(x in query.lower() for x in ("near me", "nearby", "nearest hospital")):
        if latitude is None or longitude is None:
            return {"answer": "I can show real nearby hospitals on the HealthCore map if you allow approximate location access. I do not use HealthCore patient-demand data as hospital locations.", "category": "nearby", "suggestions": []}
        answer, places = nearby(latitude, longitude)
        return {"answer": answer, "category": "nearby", "suggestions": ["Search again", "Show HealthCore bed availability"], "user_location": {"latitude": latitude, "longitude": longitude}, "nearby_places": places}
    answer, category, followups = local_answer(db, query, history or [], latitude, longitude)
    return {"answer": model_answer(query, history or [], answer) or answer, "category": category, "suggestions": followups}
